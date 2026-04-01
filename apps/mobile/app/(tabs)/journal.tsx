import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView, SectionList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { trackerApi } from '../../src/api/services';
import { TrackerEntry, TrackerReport } from '../../src/types';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(entries: TrackerEntry[]) {
  const map = new Map<string, TrackerEntry[]>();
  entries.forEach(e => {
    const key = new Date(e.loggedAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return Array.from(map.entries()).map(([key, data]) => ({
    title: formatDate(data[0].loggedAt),
    data,
  }));
}

type Tab = 'journal' | 'report';

export default function JournalScreen() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [report, setReport] = useState<TrackerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('journal');

  async function load() {
    try {
      const [h, r] = await Promise.all([trackerApi.getHistory(), trackerApi.getReport()]);
      setEntries(h);
      setReport(r);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le journal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await trackerApi.deleteEntry(id);
            setEntries(prev => prev.filter(e => e.id !== id));
          } catch {
            Alert.alert('Erreur', 'Suppression échouée.');
          }
        },
      },
    ]);
  }

  const sections = groupByDate(entries);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mon Journal</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>Entrées</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.tabActive]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>Rapport</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'journal' && (
        entries.length === 0
          ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📓</Text>
              <Text style={styles.emptyText}>Aucune entrée pour l'instant.</Text>
              <Text style={styles.emptyHint}>Utilise le Tracker pour commencer !</Text>
            </View>
          )
          : (
            <SectionList
              sections={sections}
              keyExtractor={item => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2d6a4f" />}
              contentContainerStyle={styles.listContent}
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              renderItem={({ item }) => (
                <View style={styles.entryCard}>
                  <View style={[styles.entryColorBar, { backgroundColor: item.emotion.color }]} />
                  <View style={styles.entryBody}>
                    <Text style={styles.entryEmotion}>{item.emotion.label}</Text>
                    {item.comment ? <Text style={styles.entryComment}>{item.comment}</Text> : null}
                    <View style={styles.intensityRow}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            { backgroundColor: i <= item.intensity ? item.emotion.color : '#e0e0e0' },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )
      )}

      {activeTab === 'report' && report && (
        <FlatList
          data={Object.entries(report.emotionCount).sort((a, b) => b[1] - a[1])}
          keyExtractor={([label]) => label}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <>
              <View style={styles.statsRow}>
                <StatCard label="Entrées" value={report.totalEntries} />
                <StatCard label="Jours actifs" value={report.activeDays} />
                <StatCard label="Intensité moy." value={report.avgIntensity?.toFixed(1)} />
              </View>
              {report.dominantEmotion && (
                <View style={styles.dominantCard}>
                  <Text style={styles.dominantLabel}>Émotion dominante ce mois</Text>
                  <Text style={styles.dominantValue}>{report.dominantEmotion}</Text>
                </View>
              )}
              <Text style={styles.sectionTitle}>Répartition des émotions</Text>
            </>
          )}
          renderItem={({ item: [label, count] }) => (
            <View style={styles.emotionBar}>
              <Text style={styles.emotionBarLabel}>{label}</Text>
              <View style={styles.emotionBarTrack}>
                <View style={[styles.emotionBarFill, { width: `${Math.round((count / report.totalEntries) * 100)}%` }]} />
              </View>
              <Text style={styles.emotionBarCount}>{count}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fffe' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fffe' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingBottom: 12 },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 3, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#7f8c8d' },
  tabTextActive: { color: '#2d6a4f' },
  listContent: { padding: 16, paddingTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyHint: { fontSize: 13, color: '#95a5a6' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  entryColorBar: { width: 4 },
  entryBody: { flex: 1, padding: 12 },
  entryEmotion: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  entryComment: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  intensityRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  deleteBtn: { padding: 12, justifyContent: 'center' },
  deleteBtnText: { color: '#e74c3c', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2d6a4f' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  dominantCard: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14, marginBottom: 4,
    alignItems: 'center',
  },
  dominantLabel: { fontSize: 12, color: '#555', marginBottom: 4 },
  dominantValue: { fontSize: 20, fontWeight: '800', color: '#2d6a4f' },
  emotionBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  emotionBarLabel: { width: 90, fontSize: 13, color: '#1a1a2e', fontWeight: '500' },
  emotionBarTrack: { flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  emotionBarFill: { height: '100%', backgroundColor: '#2d6a4f', borderRadius: 4 },
  emotionBarCount: { width: 28, fontSize: 13, color: '#7f8c8d', textAlign: 'right' },
});
