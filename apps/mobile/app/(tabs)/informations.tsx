import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { pagesApi } from '../../src/api/services';
import { PageInfo, PageCategory } from '../../src/types';

const CATEGORIES: { key: PageCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'PREVENTION', label: 'Prévention' },
  { key: 'EXERCISE', label: 'Exercices' },
  { key: 'INFORMATION', label: 'Informations' },
];

const CATEGORY_COLORS: Record<PageCategory, string> = {
  PREVENTION: '#e74c3c',
  EXERCISE: '#2ecc71',
  INFORMATION: '#3498db',
};

const CATEGORY_LABELS: Record<PageCategory, string> = {
  PREVENTION: 'Prévention',
  EXERCISE: 'Exercice',
  INFORMATION: 'Information',
};

export default function InformationsScreen() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PageCategory | 'ALL'>('ALL');
  const [selected, setSelected] = useState<PageInfo | null>(null);

  useFocusEffect(useCallback(() => {
    pagesApi.getPublished()
      .then(setPages)
      .catch(() => Alert.alert('Erreur', 'Impossible de charger les articles.'))
      .finally(() => setLoading(false));
  }, []));

  const filtered = activeCategory === 'ALL'
    ? pages
    : pages.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Informations</Text>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.filterChip, activeCategory === c.key && styles.filterChipActive]}
            onPress={() => setActiveCategory(c.key)}
          >
            <Text style={[styles.filterChipText, activeCategory === c.key && styles.filterChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0
        ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>Aucun article disponible.</Text>
          </View>
        )
        : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[item.category] }]}>
                    {CATEGORY_LABELS[item.category]}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPreview} numberOfLines={2}>
                  {item.content.replace(/[#*>\-]/g, '').trim()}
                </Text>
                <Text style={styles.readMore}>Lire la suite →</Text>
              </TouchableOpacity>
            )}
          />
        )
      }

      {/* Article Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[selected.category] + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[selected.category] }]}>
                  {CATEGORY_LABELS[selected.category]}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selected.title}</Text>
              <Text style={styles.modalBody}>{selected.content}</Text>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fffe' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fffe' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingBottom: 12 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9',
  },
  filterChipActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#555' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  cardPreview: { fontSize: 13, color: '#7f8c8d', lineHeight: 19, marginBottom: 8 },
  readMore: { fontSize: 13, color: '#2d6a4f', fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e8f5e9' },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 14, color: '#2d6a4f', fontWeight: '600' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 16, lineHeight: 28 },
  modalBody: { fontSize: 15, color: '#444', lineHeight: 24 },
});
