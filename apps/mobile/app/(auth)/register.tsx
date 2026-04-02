import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (value: string) => setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        city: form.city.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      Alert.alert('Inscription échouée', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>CESIZen</Text>
          <Text style={styles.tagline}>Créer un compte</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Inscription</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Prénom *"
              placeholderTextColor="#95a5a6"
              value={form.firstName}
              onChangeText={update('firstName')}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Nom *"
              placeholderTextColor="#95a5a6"
              value={form.lastName}
              onChangeText={update('lastName')}
              autoCapitalize="words"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#95a5a6"
            value={form.email}
            onChangeText={update('email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe *"
            placeholderTextColor="#95a5a6"
            value={form.password}
            onChangeText={update('password')}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Ville (optionnel)"
            placeholderTextColor="#95a5a6"
            value={form.city}
            onChangeText={update('city')}
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2d6a4f' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: '#b7e4c7', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  half: { flex: 1 },
  button: {
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#7f8c8d', fontSize: 14 },
  linkBold: { color: '#2d6a4f', fontWeight: '700' },
});
