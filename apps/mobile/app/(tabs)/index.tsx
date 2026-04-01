import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { emotionsApi, trackerApi } from '../../src/api/services';
import { Emotion } from '../../src/types';

type Step = 'primary' | 'sub' | 'intensity' | 'comment';

export default function TrackerScreen() {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const primaryEmotions = emotions.filter(e => e.level === 1);

  function selectPrimary(emotion: Emotion) {
    setSelectedPrimary(emotion);
    const hasSub = emotion.children && emotion.children.length > 0;
    if (hasSub) {
      setStep('sub');
    } else {
      setSelectedEmotion(emotion);
      setStep('intensity');
    }
  }

  function selectSub(emotion: Emotion) {
    setSelectedEmotion(emotion);
    setStep('intensity');
  }

  async function handleSubmit() {
    if (!selectedEmotion) return;
    setSubmitting(true);
    try {
      await trackerApi.addEntry({
        emotionId: selectedEmotion.id,
        intensity,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Enregistré !', `"${selectedEmotion.label}" ajouté à ton journal.`);
      reset();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'entrée.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep('primary');
    setSelectedPrimary(null);
    setSelectedEmotion(null);
    setIntensity(3);
    setComment('');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comment tu te sens ?</Text>
        {step !== 'primary' && (
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetBtn}>Recommencer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        {selectedPrimary && (
          <View style={[styles.breadcrumbChip, { backgroundColor: selectedPrimary.color + '30' }]}>
            <Text style={[styles.breadcrumbText, { color: selectedPrimary.color }]}>
              {selectedPrimary.label}
            </Text>
          </View>
        )}
        {selectedEmotion && selectedEmotion.id !== selectedPrimary?.id && (
          <View style={[styles.breadcrumbChip, { backgroundColor: selectedEmotion.color + '30' }]}>
            <Text style={[styles.breadcrumbText, { color: selectedEmotion.color }]}>
              {selectedEmotion.label}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Step 1: Primary emotions */}
        {step === 'primary' && (
          <>
            <Text style={styles.stepLabel}>Choisis une émotion principale</Text>
            <View style={styles.grid}>
              {primaryEmotions.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.emotionCard, { borderColor: e.color }]}
                  onPress={() => selectPrimary(e)}
                >
                  <View style={[styles.emotionDot, { backgroundColor: e.color }]} />
                  <Text style={styles.emotionLabel}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Step 2: Sub-emotions */}
        {step === 'sub' && selectedPrimary?.children && (
          <>
            <Text style={styles.stepLabel}>Précise ton émotion</Text>
            <View style={styles.grid}>
              {selectedPrimary.children.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.emotionCard, { borderColor: e.color }]}
                  onPress={() => selectSub(e)}
                >
                  <View style={[styles.emotionDot, { backgroundColor: e.color }]} />
                  <Text style={styles.emotionLabel}>{e.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.emotionCard, styles.emotionCardSkip]}
                onPress={() => { setSelectedEmotion(selectedPrimary); setStep('intensity'); }}
              >
                <Text style={styles.emotionLabelSkip}>Rester sur{'\n'}"{selectedPrimary.label}"</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 3: Intensity */}
        {step === 'intensity' && (
          <>
            <Text style={styles.stepLabel}>Intensité ressentie</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.intensityDot,
                    { backgroundColor: i <= intensity ? (selectedEmotion?.color ?? '#2d6a4f') : '#e0e0e0' },
                  ]}
                  onPress={() => setIntensity(i)}
                >
                  <Text style={styles.intensityNum}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.intensityHint}>
              {intensity === 1 ? 'Très faible' : intensity === 2 ? 'Faible' : intensity === 3 ? 'Modérée' : intensity === 4 ? 'Forte' : 'Très forte'}
            </Text>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('comment')}>
              <Text style={styles.nextBtnText}>Continuer →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 4: Comment + Submit */}
        {step === 'comment' && (
          <>
            <Text style={styles.stepLabel}>Ajouter une note (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Qu'est-ce qui a déclenché cette émotion ?"
              placeholderTextColor="#95a5a6"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fffe' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fffe' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  resetBtn: { fontSize: 13, color: '#2d6a4f', fontWeight: '600' },
  breadcrumb: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  breadcrumbChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  breadcrumbText: { fontSize: 12, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },
  stepLabel: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emotionCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionCardSkip: { borderColor: '#ccc', borderStyle: 'dashed' },
  emotionDot: { width: 12, height: 12, borderRadius: 6 },
  emotionLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  emotionLabelSkip: { fontSize: 12, color: '#7f8c8d', fontStyle: 'italic' },
  intensityRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  intensityDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityNum: { color: '#fff', fontWeight: '800', fontSize: 18 },
  intensityHint: { textAlign: 'center', color: '#7f8c8d', fontSize: 14, marginBottom: 24 },
  nextBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    backgroundColor: '#fff',
    marginBottom: 20,
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
