import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { authApi, trackerApi } from '../../src/api/services';

type ActiveModal = null | 'edit' | 'password';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { isDark, mode, setMode, colors } = useTheme();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);

  // Edit profile form
  const [form, setForm] = useState({ firstName: '', lastName: '', city: '' });
  const [saving, setSaving] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshUser();
    trackerApi.getStreak().then(r => setStreak(r.streak)).catch(() => {});
    trackerApi.getReport().then(r => setTotalEntries(r.totalEntries)).catch(() => {});
  }, []));

  function openEdit() {
    setForm({
      firstName: user?.userInfo?.firstName ?? '',
      lastName: user?.userInfo?.lastName ?? '',
      city: user?.userInfo?.city ?? '',
    });
    setActiveModal('edit');
  }

  async function handleSave() {
    if (!form.firstName || !form.lastName) {
      Alert.alert('Erreur', 'Prénom et nom sont requis.');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city.trim() || undefined,
      });
      await refreshUser();
      setActiveModal(null);
    } catch {
      Alert.alert('Erreur', 'Mise à jour échouée.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (pwForm.next.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.next);
      Alert.alert('Succès', 'Mot de passe mis à jour !');
      setPwForm({ current: '', next: '', confirm: '' });
      setActiveModal(null);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Changement de mot de passe échoué.');
    } finally {
      setPwSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées (RGPD).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await authApi.deleteAccount();
              await logout();
            } catch {
              Alert.alert('Erreur', 'Suppression échouée.');
            }
          },
        },
      ]
    );
  }

  if (!user) return null;

  const initials = [user.userInfo?.firstName?.[0], user.userInfo?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  const roleLabel = user.role === 'SUPER_ADMIN' ? '⭐ Super Admin' : user.role === 'ADMIN' ? '⚙️ Administrateur' : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Mon Profil</Text>

        {/* Avatar + stats */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {user.userInfo && (
            <Text style={styles.fullName}>{user.userInfo.firstName} {user.userInfo.lastName}</Text>
          )}
          <Text style={styles.email}>{user.email}</Text>
          {roleLabel && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalEntries ?? '—'}</Text>
              <Text style={styles.statLabel}>Entrées (mois)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{streak !== null ? `${streak}🔥` : '—'}</Text>
              <Text style={styles.statLabel}>Jours consécutifs</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <InfoRow label="Prénom" value={user.userInfo?.firstName} />
          <InfoRow label="Nom" value={user.userInfo?.lastName} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Ville" value={user.userInfo?.city} />
          <InfoRow
            label="Membre depuis"
            value={new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          />
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pwBtn} onPress={() => { setPwForm({ current: '', next: '', confirm: '' }); setActiveModal('password'); }}>
            <Text style={styles.pwBtnText}>Changer le mot de passe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.themeBtn}
            onPress={() => setMode(isDark ? 'light' : 'dark')}
          >
            <Text style={styles.themeBtnText}>{isDark ? '☀️ Mode clair' : '🌙 Mode sombre'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteBtnText}>Supprimer mon compte (RGPD)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={activeModal === 'edit'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.inputLabel}>Prénom *</Text>
            <TextInput style={styles.input} value={form.firstName} onChangeText={v => setForm(f => ({ ...f, firstName: v }))} autoCapitalize="words" />
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput style={styles.input} value={form.lastName} onChangeText={v => setForm(f => ({ ...f, lastName: v }))} autoCapitalize="words" />
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput style={styles.input} value={form.city} onChangeText={v => setForm(f => ({ ...f, city: v }))} autoCapitalize="words" />
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={activeModal === 'password'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.inputLabel}>Mot de passe actuel *</Text>
            <TextInput
              style={styles.input}
              value={pwForm.current}
              onChangeText={v => setPwForm(f => ({ ...f, current: v }))}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#bbb"
            />
            <Text style={styles.inputLabel}>Nouveau mot de passe * (8 min.)</Text>
            <TextInput
              style={styles.input}
              value={pwForm.next}
              onChangeText={v => setPwForm(f => ({ ...f, next: v }))}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#bbb"
            />
            <Text style={styles.inputLabel}>Confirmation *</Text>
            <TextInput
              style={styles.input}
              value={pwForm.confirm}
              onChangeText={v => setPwForm(f => ({ ...f, confirm: v }))}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#bbb"
            />
            <TouchableOpacity style={[styles.saveBtn, pwSaving && styles.saveBtnDisabled]} onPress={handleChangePassword} disabled={pwSaving}>
              {pwSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Mettre à jour</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fffe' },
  scroll: { padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  email: { fontSize: 14, color: '#7f8c8d' },
  roleBadge: { marginTop: 8, backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#2d6a4f' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2, textAlign: 'center' },
  section: { borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#7f8c8d' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1, textAlign: 'right' },
  editBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pwBtn: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  pwBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 15 },
  themeBtn: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  themeBtnText: { color: '#333', fontWeight: '700', fontSize: 15 },
  logoutBtn: { backgroundColor: '#f0f4ff', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#c5d5ff' },
  logoutBtnText: { color: '#3d5a80', fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: '#fff5f5', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffc5c5' },
  deleteBtnText: { color: '#e74c3c', fontWeight: '600', fontSize: 14 },
  modal: { flex: 1, backgroundColor: '#f8fffe' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  cancelText: { fontSize: 15, color: '#7f8c8d' },
  modalContent: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fff', marginBottom: 16 },
  saveBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
