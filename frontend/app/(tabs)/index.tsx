import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { fetchTasks, createTask, updateTask } from '../../api';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
}

export default function IndexScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [titleSearch, setTitleSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);

  const load = async () => {
    try {
      setLoading(true);
      const q: any = {};
      if (statusFilter) q.status = statusFilter;
      if (titleSearch) q.title_like = titleSearch;
      const data = (await fetchTasks(q)) as Task[];
      setTasks(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const onSearch = async () => { await load(); };

  const addTask = async () => {
    if (!newTitle.trim()) return Alert.alert('Validation', 'Title is required');
    try {
      await createTask({ title: newTitle.trim(), description: newDesc.trim() });
      setNewTitle(''); setNewDesc(''); setAddModalVisible(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? String(e));
    }
  };

  const markComplete = async (id: number) => {
    try {
      await updateTask(id, { status: 'Completed' });
      await load();
    } catch (e: any) { Alert.alert('Error', e?.message ?? String(e)); }
  };

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>

      <View style={styles.cardRight}>
        <View style={[styles.badge, item.status === 'Completed' ? styles.badgeCompleted : styles.badgePending]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>

        {item.status !== 'Completed' && (
          <TouchableOpacity style={styles.completeBtn} onPress={() => markComplete(item.id)}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Task Manager</Text>
          <Text style={styles.subtitle}>Manage your tasks quickly</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search title..."
            value={titleSearch}
            onChangeText={setTitleSearch}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onSearch}>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterChip label="All" active={statusFilter === ''} onPress={() => setStatusFilter('')} />
        <FilterChip label="Pending" active={statusFilter === 'Pending'} onPress={() => setStatusFilter('Pending')} />
        <FilterChip label="Completed" active={statusFilter === 'Completed'} onPress={() => setStatusFilter('Completed')} />
      </View>

      {/* Add quick action */}
      <View style={styles.addRow}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <TouchableOpacity style={styles.addQuick} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addQuickText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No tasks found. Add one!</Text></View>}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Task</Text>

            <TextInput
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Description"
              value={newDesc}
              onChangeText={setNewDesc}
              style={[styles.modalInput, { height: 80 }]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#ccc' }]} onPress={() => setAddModalVisible(false)}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#2f6bed' }]} onPress={addTask}>
                <Text style={{ color: '#fff' }}>Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* small reusable chip component */
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[chipStyles.chip, active ? chipStyles.chipActive : null]}>
      <Text style={[chipStyles.chipText, active ? chipStyles.chipTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2f6bed' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 2 },
  statBox: { alignItems: 'center', backgroundColor: '#eef4ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#2f6bed' },
  statLabel: { fontSize: 12, color: '#2f6bed' },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, fontSize: 14 },

  iconBtn: { marginLeft: 8, backgroundColor: '#2f6bed', padding: 10, borderRadius: 10 },

  filters: { flexDirection: 'row', marginBottom: 12 },

  addRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  addQuick: { flexDirection: 'row', backgroundColor: '#2f6bed', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center' },
  addQuickText: { color: '#fff', marginLeft: 8 },

  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { marginTop: 6, color: '#555', fontSize: 13 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  badgePending: { backgroundColor: '#fff7e6', borderWidth: 1, borderColor: '#ffb547' },
  badgeCompleted: { backgroundColor: '#e9f8ee', borderWidth: 1, borderColor: '#3fbf88' },
  badgeText: { fontSize: 12, color: '#333' },

  completeBtn: { backgroundColor: '#3fbf88', padding: 8, borderRadius: 8 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#666' },

  fab: { position: 'absolute', right: 18, bottom: 28, backgroundColor: '#2f6bed', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },

  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
});
