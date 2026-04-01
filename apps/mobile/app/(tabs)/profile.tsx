import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, SafeAreaView, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { authApi } from '../../src/api/services';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', city: '' });
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { refreshUser(); }, []));

  function openEdit() {
    setForm({
      firstName: user?.userInfo?.firstName ?? '',
      lastName: user?.userInfo?.lastName ?? '',
      city: user?.userInfo?.city ?? '',
    });
    setEditVisible(true);
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
      setEditVisible(false);
    } catch {
      Alert.alert('Erreur', 'Mise à jour échouée.');
    } finally {
      setSaving(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Mon Profil</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {user.userInfo && (
            <Text style={styles.fullName}>
              {user.userInfo.firstName} {user.userInfo.lastName}
            </Text>
          )}
          <Text style={styles.email}>{user.email}</Text>
          {user.role === 'ADMIN' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Administrateur</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.section}>
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
        <View style={styles.section}>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteBtnText}>Supprimer mon compte (RGPD)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.inputLabel}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={form.firstName}
              onChangeText={v => setForm(f => ({ ...f, firstName: v }))}
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={v => setForm(f => ({ ...f, lastName: v }))}
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={v => setForm(f => ({ ...f, city: v }))}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Enregistrer</Text>
              }
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
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2d6a4f',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  email: { fontSize: 14, color: '#7f8c8d' },
  adminBadge: { marginTop: 8, backgroundColor: '#fff3cd', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#ffc107' },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#7f8c8d' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1, textAlign: 'right' },
  editBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#1a1a2e', backgroundColor: '#fff', marginBottom: 16,
  },
  saveBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
