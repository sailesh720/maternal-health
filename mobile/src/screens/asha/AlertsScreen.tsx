import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { alertsApi } from '../../services/api';
import { Card, SectionHeader, EmptyState, LoadingScreen } from '../../components/ui';
import { Colors, Spacing, Radius, riskColor } from '../../utils/theme';
import { formatDistanceToNow } from 'date-fns';
import type { Alert as AlertType } from '../../types';

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_blood_pressure: '🩸 High Blood Pressure',
  abnormal_heart_rate: '💓 Abnormal Heart Rate',
  no_activity_detected: '😴 No Activity Detected',
  missed_checkup: '📅 Missed Checkup',
  temperature_spike: '🌡 Temperature Spike',
  low_oxygen: '💨 Low Oxygen Level',
};

type StatusFilter = '' | 'new' | 'acknowledged' | 'resolved';
type SeverityFilter = '' | 'high' | 'medium' | 'low';

export function AlertsScreen() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('');

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['alerts', statusFilter, severityFilter],
    queryFn: () => alertsApi.list({
      ...(statusFilter && { status: statusFilter }),
      ...(severityFilter && { severity: severityFilter }),
      limit: '60',
    }),
    refetchInterval: 20000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  if (isLoading) return <LoadingScreen />;

  const allAlerts: AlertType[] = alerts ?? [];
  const newCount = allAlerts.filter((a) => a.status === 'new').length;

  return (
    <View style={styles.container}>
      {newCount > 0 && (
        <View style={styles.newBanner}>
          <Ionicons name="notifications" size={14} color={Colors.coral400} />
          <Text style={styles.newBannerText}>{newCount} new alerts require attention</Text>
        </View>
      )}

      {/* Status filters */}
      <View style={styles.filterRow}>
        {(['' , 'new', 'acknowledged', 'resolved'] as StatusFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Severity filters */}
      <View style={[styles.filterRow, { paddingTop: 0 }]}>
        {(['' , 'high', 'medium', 'low'] as SeverityFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSeverityFilter(s)}
            style={[styles.filterChip, severityFilter === s && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, severityFilter === s && styles.filterTextActive]}>
              {s === '' ? 'Any severity' : `${s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '🟢'} ${s}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={allAlerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.coral500} />}
        ListEmptyComponent={<EmptyState message="No alerts for selected filters" />}
        renderItem={({ item: alert }) => (
          <AlertCard
            alert={alert}
            onAcknowledge={() => {
              Alert.alert('Acknowledge Alert', 'Mark this alert as acknowledged?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Acknowledge', onPress: () => acknowledgeMutation.mutate(alert.id) },
              ]);
            }}
            onResolve={() => {
              Alert.alert('Resolve Alert', 'Mark this alert as resolved?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Resolve', style: 'destructive', onPress: () => resolveMutation.mutate(alert.id) },
              ]);
            }}
          />
        )}
      />
    </View>
  );
}

function AlertCard({
  alert: a, onAcknowledge, onResolve,
}: { alert: AlertType; onAcknowledge: () => void; onResolve: () => void }) {
  const severityColor = { high: Colors.coral500, medium: Colors.amber400, low: Colors.jade400 }[a.severity];
  const statusColor = {
    new: Colors.coral400, acknowledged: Colors.amber400, resolved: Colors.jade400,
  }[a.status];

  return (
    <Card style={[styles.alertCard, { borderLeftColor: severityColor }]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertType}>{ALERT_TYPE_LABELS[a.alert_type] ?? a.alert_type}</Text>
        <View style={[styles.statusChip, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{a.status}</Text>
        </View>
      </View>

      <Text style={styles.alertMessage}>{a.message}</Text>
      <Text style={styles.alertAction}>→ {a.suggested_action}</Text>

      <View style={styles.alertMeta}>
        {a.patient_name && <Text style={styles.metaText}>👤 {a.patient_name}</Text>}
        <Text style={styles.metaText}>
          🕒 {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
        </Text>
      </View>

      {a.status !== 'resolved' && (
        <View style={styles.alertActions}>
          {a.status === 'new' && (
            <TouchableOpacity style={[styles.actionBtn, styles.ackBtn]} onPress={onAcknowledge}>
              <Ionicons name="checkmark" size={13} color={Colors.amber400} />
              <Text style={[styles.actionBtnText, { color: Colors.amber400 }]}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={onResolve}>
            <Ionicons name="checkmark-done" size={13} color={Colors.jade400} />
            <Text style={[styles.actionBtnText, { color: Colors.jade400 }]}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  newBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,95,61,0.08)', borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,95,61,0.15)', paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  newBannerText: { fontSize: 13, color: Colors.coral400 },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: Spacing.md, paddingTop: 10, paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.navy800,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,95,61,0.1)', borderColor: 'rgba(255,95,61,0.3)',
  },
  filterText: { fontSize: 12, color: Colors.textMuted },
  filterTextActive: { color: Colors.coral400 },
  list: { padding: Spacing.md, paddingBottom: 40, gap: 10 },
  alertCard: { borderLeftWidth: 3 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertType: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  statusChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
  alertMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  alertAction: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  alertMeta: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: Colors.textMuted },
  alertActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.sm, borderWidth: 1,
  },
  ackBtn: { backgroundColor: 'rgba(255,181,71,0.08)', borderColor: 'rgba(255,181,71,0.25)' },
  resolveBtn: { backgroundColor: 'rgba(27,191,132,0.08)', borderColor: 'rgba(27,191,132,0.25)' },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});
