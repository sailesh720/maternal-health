import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { patientsApi } from '../../services/api';
import { Card, RiskBadge, EmptyState, LoadingScreen } from '../../components/ui';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { formatDistanceToNow } from 'date-fns';
import type { Patient } from '../../types';

const FILTER_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'high', label: '🔴 High Risk' },
  { key: 'medium', label: '🟡 Medium' },
  { key: 'low', label: '🟢 Low' },
];

export function PatientListScreen({ navigation, route }: any) {
  const initialRisk = route?.params?.riskFilter ?? '';
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(initialRisk);

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
    refetchInterval: 60000,
  });

  const filtered = (patients ?? []).filter((p: Patient) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.name.toLowerCase().includes(q)
      || p.village.toLowerCase().includes(q);
    const matchRisk = !riskFilter || p.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search name or village…"
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewPatient')}
        >
          <Ionicons name="add" size={22} color={Colors.coral500} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setRiskFilter(f.key)}
            style={[styles.filterChip, riskFilter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, riskFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>{filtered.length} patients</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.coral500} />}
        ListEmptyComponent={<EmptyState message="No patients match your filters" />}
        renderItem={({ item: p }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
            activeOpacity={0.8}
          >
            <PatientListCard patient={p} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function PatientListCard({ patient: p }: { patient: Patient }) {
  const riskAccent = {
    high: Colors.coral500, medium: Colors.amber400, low: Colors.jade400
  }[p.risk_level ?? 'low'] ?? Colors.borderSubtle;

  return (
    <Card style={[styles.card, { borderLeftColor: riskAccent, borderLeftWidth: 3 }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.meta}>{p.village} · Age {p.age}</Text>
        </View>
        <RiskBadge level={p.risk_level} />
      </View>

      <View style={styles.chips}>
        <Chip icon="fitness" value={`Wk ${p.pregnancy_week}`} />
        <Chip icon="medical" value={p.medical_conditions.length > 0 ? p.medical_conditions[0] : 'No conditions'} />
        {p.device_id && <Chip icon="watch" value={p.device_id} />}
      </View>

      {p.last_vitals_update && (
        <Text style={styles.updated}>
          Updated {formatDistanceToNow(new Date(p.last_vitals_update), { addSuffix: true })}
        </Text>
      )}
    </Card>
  );
}

function Chip({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.chipBox}>
      <Ionicons name={icon} size={11} color={Colors.textMuted} />
      <Text style={styles.chipText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: Spacing.md, paddingBottom: 8,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navy800, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.borderMedium,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  addBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,95,61,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,95,61,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.navy800, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,95,61,0.12)', borderColor: 'rgba(255,95,61,0.3)',
  },
  filterChipText: { fontSize: 12, color: Colors.textMuted },
  filterChipTextActive: { color: Colors.coral400 },
  countText: {
    fontSize: 11, color: Colors.textMuted,
    paddingHorizontal: Spacing.md, paddingBottom: 6,
  },
  list: { padding: Spacing.md, paddingTop: 4, paddingBottom: 32, gap: 10 },
  card: { marginBottom: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chipBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.navy900, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  chipText: { fontSize: 11, color: Colors.textSecondary, maxWidth: 120 },
  updated: { fontSize: 10, color: Colors.textMuted, marginTop: 6, textAlign: 'right' },
});
