import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { emotionsApi, trackerApi } from '../../src/api/services';
import { Emotion } from '../../src/types';

type Step = 'primary' | 'sub' | 'intensity' | 'comment';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);

  // Tracker state
  const [step, setStep] = useState<Step>('primary');
  const [selectedPrimary, setSelectedPrimary] = useState<Emotion | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    emotionsApi.getAll()
      .then(setEmotions)
      .catch(() => Alert.alert('Erreur', 'Impossible de charger les émotions.'))
      .finally(() => setLoading(false));
    trackerApi.getStreak().then(r => setStreak(r.streak)).catch(() => {});
  }, []);

  const primaryEmotions = emotions.filter(e => e.level === 1);
  const firstName = user?.userInfo?.firstName ?? 'vous';

  function openTracker() {
    resetTracker();
    setModalVisible(true);
  }

  function resetTracker() {
    setStep('primary');
    setSelectedPrimary(null);
    setSelectedEmotion(null);
    setIntensity(3);
    setComment('');
  }

  function selectPrimary(emotion: Emotion) {
    setSelectedPrimary(emotion);
    const hasSub = emotion.children && emotion.children.length > 0;
    if (hasSub) { setStep('sub'); } else { setSelectedEmotion(emotion); setStep('intensity'); }
  }

  function selectSub(emotion: Emotion) {
    setSelectedEmotion(emotion);
    setStep('intensity');
  }

  async function handleSubmit() {
    if (!selectedEmotion) return;
    setSubmitting(true);
    try {
      await trackerApi.addEntry({ emotionId: selectedEmotion.id, intensity, comment: comment.trim() || undefined });
      setModalVisible(false);
      resetTracker();
      Alert.alert('Enregistré !', `"${selectedEmotion.label}" ajouté à ton journal.`);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'entrée.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
            </View>
            <View style={{ gap: 8, alignItems: 'flex-end' }}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
              </View>
              {streak !== null && streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>{streak}🔥</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.subGreeting}>{todayLabel()}</Text>
        </View>

        {/* CTA Principal */}
        <TouchableOpacity style={styles.ctaCard} onPress={openTracker} activeOpacity={0.85}>
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaQuestion}>Comment tu te sens ?</Text>
            <Text style={styles.ctaHint}>Enregistre une émotion maintenant</Text>
          </View>
          <View style={styles.ctaIcon}>
            <Text style={{ fontSize: 32 }}>💚</Text>
          </View>
        </TouchableOpacity>

        {/* Émotions rapides */}
        {!loading && primaryEmotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accès rapide</Text>
            <View style={styles.quickGrid}>
              {primaryEmotions.slice(0, 6).map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.quickChip, { borderColor: e.color, backgroundColor: e.color + '18' }]}
                  onPress={() => {
                    resetTracker();
                    setSelectedPrimary(e);
                    const hasSub = e.children && e.children.length > 0;
                    if (hasSub) { setStep('sub'); } else { setSelectedEmotion(e); setStep('intensity'); }
                    setModalVisible(true);
                  }}
                >
                  <View style={[styles.quickDot, { backgroundColor: e.color }]} />
                  <Text style={[styles.quickLabel, { color: e.color }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardIcon}>🌿</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoCardTitle}>Prendre soin de soi</Text>
            <Text style={styles.infoCardText}>Suivre ses émotions quotidiennement aide à mieux se comprendre et réduire le stress.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Tracker Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tracker d'émotion</Text>
              {selectedPrimary && (
                <View style={styles.breadcrumb}>
                  <View style={[styles.chip, { backgroundColor: selectedPrimary.color + '25' }]}>
                    <Text style={[styles.chipText, { color: selectedPrimary.color }]}>{selectedPrimary.label}</Text>
                  </View>
                  {selectedEmotion && selectedEmotion.id !== selectedPrimary.id && (
                    <View style={[styles.chip, { backgroundColor: selectedEmotion.color + '25' }]}>
                      <Text style={[styles.chipText, { color: selectedEmotion.color }]}>{selectedEmotion.label}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

            {/* Step 1 : Primary */}
            {step === 'primary' && (
              <>
                <Text style={styles.stepLabel}>Quelle émotion principale ?</Text>
                <View style={styles.grid}>
                  {primaryEmotions.map(e => (
                    <TouchableOpacity key={e.id} style={[styles.emotionCard, { borderColor: e.color }]} onPress={() => selectPrimary(e)}>
                      <View style={[styles.emotionDot, { backgroundColor: e.color }]} />
                      <Text style={styles.emotionLabel}>{e.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Step 2 : Sub-emotions */}
            {step === 'sub' && selectedPrimary?.children && (
              <>
                <Text style={styles.stepLabel}>Précise un peu plus</Text>
                <View style={styles.grid}>
                  {selectedPrimary.children.map(e => (
                    <TouchableOpacity key={e.id} style={[styles.emotionCard, { borderColor: e.color }]} onPress={() => selectSub(e)}>
                      <View style={[styles.emotionDot, { backgroundColor: e.color }]} />
                      <Text style={styles.emotionLabel}>{e.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.emotionCard, { borderColor: '#ccc', borderStyle: 'dashed' }]}
                    onPress={() => { setSelectedEmotion(selectedPrimary); setStep('intensity'); }}
                  >
                    <Text style={{ fontSize: 12, color: '#7f8c8d', fontStyle: 'italic' }}>Garder "{selectedPrimary.label}"</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 3 : Intensity */}
            {step === 'intensity' && (
              <>
                <Text style={styles.stepLabel}>Quelle intensité ?</Text>
                <View style={styles.intensityRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.intensityBtn, { backgroundColor: i <= intensity ? (selectedEmotion?.color ?? '#2d6a4f') : '#f0f0f0' }]}
                      onPress={() => setIntensity(i)}
                    >
                      <Text style={[styles.intensityNum, { color: i <= intensity ? '#fff' : '#aaa' }]}>{i}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.intensityHint}>
                  {['', 'Très faible', 'Faible', 'Modérée', 'Forte', 'Très forte'][intensity]}
                </Text>
                <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('comment')}>
                  <Text style={styles.nextBtnText}>Continuer →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 4 : Comment */}
            {step === 'comment' && (
              <>
                <Text style={styles.stepLabel}>Une note ? (optionnel)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Qu'est-ce qui a déclenché cette émotion ?"
                  placeholderTextColor="#b2bec3"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Enregistrer ✓</Text>}
                </TouchableOpacity>
              </>
            )}

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const GREEN = '#2d6a4f';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0faf4' },
  scroll: { paddingBottom: 24 },

  // Header
  header: { backgroundColor: GREEN, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 16, color: '#b7e4c7', fontWeight: '500' },
  name: { fontSize: 28, color: '#fff', fontWeight: '800', marginTop: 2 },
  subGreeting: { fontSize: 13, color: '#95d5b2', marginTop: 6, textTransform: 'capitalize' },
  dateBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  streakBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dateText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // CTA
  ctaCard: {
    marginHorizontal: 20, marginTop: -18,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaLeft: { flex: 1 },
  ctaQuestion: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  ctaHint: { fontSize: 13, color: '#7f8c8d' },
  ctaIcon: { marginLeft: 12 },

  // Section
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },

  // Quick grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  quickDot: { width: 8, height: 8, borderRadius: 4 },
  quickLabel: { fontSize: 13, fontWeight: '700' },

  // Info card
  infoCard: {
    margin: 20, marginTop: 24,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoCardIcon: { fontSize: 28, marginTop: 2 },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: GREEN, marginBottom: 4 },
  infoCardText: { fontSize: 13, color: '#4a7c59', lineHeight: 18 },

  // Modal
  modal: { flex: 1, backgroundColor: '#f8fffe' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, paddingTop: 24,
    borderBottomWidth: 1, borderBottomColor: '#e8f5e9',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  breadcrumb: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '700' },
  closeBtn: { backgroundColor: '#f0f0f0', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, color: '#555', fontWeight: '700' },
  modalScroll: { padding: 20, paddingBottom: 40 },

  // Tracker steps
  stepLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emotionCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 2, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  emotionDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  emotionLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  intensityRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
  intensityBtn: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  intensityNum: { fontSize: 18, fontWeight: '800' },
  intensityHint: { textAlign: 'center', color: '#7f8c8d', fontSize: 14, marginBottom: 24 },
  nextBtn: { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  commentInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 14,
    padding: 14, fontSize: 15, color: '#1a1a2e',
    backgroundColor: '#fff', marginBottom: 20, minHeight: 110,
  },
  submitBtn: { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
