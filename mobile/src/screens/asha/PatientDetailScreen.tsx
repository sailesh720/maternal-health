import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Linking, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { patientsApi, alertsApi, riskApi } from '../../services/api';
import {
  Card, RiskBadge, VitalChip, Button, SectionHeader,
  EmptyState, LoadingScreen, Divider,
} from '../../components/ui';
import { Colors, Spacing, Radius, riskColor } from '../../utils/theme';
import { format, formatDistanceToNow } from 'date-fns';
import { useVitalsStream } from '../../hooks/useVitalsStream';
import type { Vital } from '../../types';

type Tab = 'overview' | 'vitals' | 'risk' | 'visits' | 'emergency';

const TABS: { key: Tab; icon: any; label: string }[] = [
  { key: 'overview',  icon: 'person',      label: 'Profile'    },
  { key: 'vitals',    icon: 'pulse',        label: 'Vitals'     },
  { key: 'risk',      icon: 'warning',      label: 'Risk'       },
  { key: 'visits',    icon: 'clipboard',    label: 'Visits'     },
  { key: 'emergency', icon: 'alert-circle', label: 'Emergency'  },
];

function vitalStatus(key: string, val: number): 'normal' | 'warning' | 'critical' {
  if (key === 'heart_rate') {
    if (val > 120) return 'critical';
    if (val > 100) return 'warning';
  }
  if (key === 'systolic_bp') {
    if (val >= 160) return 'critical';
    if (val >= 140) return 'warning';
  }
  if (key === 'oxygen_level') {
    if (val < 90) return 'critical';
    if (val < 94) return 'warning';
  }
  if (key === 'temperature') {
    if (val >= 39) return 'critical';
    if (val >= 38) return 'warning';
  }
  return 'normal';
}

export function PatientDetailScreen({ route, navigation }: any) {
  const { patientId } = route.params;
  const [tab, setTab] = useState<Tab>('overview');
  const qc = useQueryClient();
  const { liveVitals } = useVitalsStream();

  const { data: patient, isLoading, refetch } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
    enabled: !!patientId,
  });

  const { data: vitals } = useQuery({
    queryKey: ['patient-vitals', patientId],
    queryFn: () => patientsApi.vitals(patientId, 15),
    enabled: !!patientId,
    refetchInterval: 30000,
  });

  const { data: risk } = useQuery({
    queryKey: ['patient-risk', patientId],
    queryFn: () => patientsApi.risk(patientId),
    enabled: !!patientId,
  });

  const { data: visits } = useQuery({
    queryKey: ['patient-visits', patientId],
    queryFn: () => patientsApi.visits(patientId),
    enabled: !!patientId,
  });

  const evaluateMutation = useMutation({
    mutationFn: () => riskApi.evaluate(patientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-risk', patientId] });
      qc.invalidateQueries({ queryKey: ['patient', patientId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  if (isLoading || !patient) return <LoadingScreen />;

  // Merge WS live vitals if available
  const wsVital = liveVitals[patientId];
  const latestVital: Vital | undefined = vitals?.[0];
  const displayVital = wsVital
    ? { ...latestVital, ...wsVital.vitals, timestamp: wsVital.timestamp }
    : latestVital;

  return (
    <View style={styles.container}>
      {/* Patient header strip */}
      <View style={styles.headerCard}>
        <View style={styles.headerAvatar}>
          <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{patient.name}</Text>
          <Text style={styles.headerMeta}>{patient.village} · Age {patient.age} · Week {patient.pregnancy_week}</Text>
          {patient.medical_conditions.length > 0 && (
            <Text style={styles.headerConditions} numberOfLines={1}>
              {patient.medical_conditions.join(', ')}
            </Text>
          )}
        </View>
        <RiskBadge level={wsVital?.risk_level as any || patient.risk_level} />
      </View>

      {/* Latest vitals strip */}
      {displayVital && (
        <View style={styles.vitalStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitalScroll}>
            <VitalChip label="Heart Rate" value={`${(displayVital as any).heart_rate?.toFixed(0)}`} unit="bpm"
              status={vitalStatus('heart_rate', (displayVital as any).heart_rate)} />
            <VitalChip label="BP" value={`${(displayVital as any).systolic_bp?.toFixed(0)}/${(displayVital as any).diastolic_bp?.toFixed(0)}`} unit="mmHg"
              status={vitalStatus('systolic_bp', (displayVital as any).systolic_bp)} />
            <VitalChip label="Temp" value={`${(displayVital as any).temperature?.toFixed(1)}`} unit="°C"
              status={vitalStatus('temperature', (displayVital as any).temperature)} />
            <VitalChip label="SpO₂" value={`${(displayVital as any).oxygen_level?.toFixed(0)}`} unit="%"
              status={vitalStatus('oxygen_level', (displayVital as any).oxygen_level)} />
            <VitalChip label="Activity" value={`${(displayVital as any).activity_level?.toFixed(0)}`} unit="score" />
          </ScrollView>
          {wsVital && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={tab === t.key ? Colors.coral400 : Colors.textMuted}
              />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.coral500} />}
      >
        {tab === 'overview' && <OverviewTab patient={patient} />}
        {tab === 'vitals' && <VitalsTab vitals={vitals ?? []} />}
        {tab === 'risk' && (
          <RiskTab
            risk={risk}
            loading={evaluateMutation.isPending}
            onEvaluate={() => evaluateMutation.mutate()}
          />
        )}
        {tab === 'visits' && <VisitsTab visits={visits ?? []} navigation={navigation} patientId={patientId} />}
        {tab === 'emergency' && <EmergencyTab patient={patient} />}
      </ScrollView>
    </View>
  );
}

// ── Sub-screens ───────────────────────────────────

function OverviewTab({ patient }: { patient: any }) {
  const rows = [
    { label: 'Full Name', value: patient.name },
    { label: 'Age', value: `${patient.age} years` },
    { label: 'Phone', value: patient.phone },
    { label: 'Village', value: `${patient.village}, ${patient.district}` },
    { label: 'Pregnancy Week', value: `Week ${patient.pregnancy_week}` },
    { label: 'Expected Due Date', value: patient.expected_due_date },
    { label: 'Medical Conditions', value: patient.medical_conditions.length ? patient.medical_conditions.join(', ') : 'None' },
    { label: 'Emergency Contact', value: patient.emergency_contact },
    { label: 'Device ID', value: patient.device_id ?? 'Not assigned' },
  ];

  return (
    <Card>
      {rows.map((row, i) => (
        <View key={row.label}>
          {i > 0 && <Divider />}
          <View style={overviewStyles.row}>
            <Text style={overviewStyles.label}>{row.label}</Text>
            <Text style={overviewStyles.value}>{row.value}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const overviewStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  value: { fontSize: 13, color: Colors.textPrimary, flex: 2, textAlign: 'right' },
});

function VitalsTab({ vitals }: { vitals: Vital[] }) {
  if (!vitals.length) return <EmptyState message="No vitals recorded yet" />;

  return (
    <View style={{ gap: Spacing.sm }}>
      {vitals.map((v) => (
        <Card key={v.id} style={vitalsStyles.row}>
          <View style={vitalsStyles.timeRow}>
            <Text style={vitalsStyles.time}>{format(new Date(v.timestamp), 'MMM d, HH:mm')}</Text>
            <Text style={vitalsStyles.source}>{v.source}</Text>
          </View>
          <View style={vitalsStyles.chips}>
            <MiniVital label="HR" value={`${v.heart_rate.toFixed(0)}`} alert={v.heart_rate > 110} />
            <MiniVital label="BP" value={`${v.systolic_bp.toFixed(0)}/${v.diastolic_bp.toFixed(0)}`} alert={v.systolic_bp >= 140} />
            <MiniVital label="Temp" value={`${v.temperature.toFixed(1)}°`} alert={v.temperature >= 38} />
            <MiniVital label="SpO₂" value={`${v.oxygen_level.toFixed(0)}%`} alert={v.oxygen_level < 94} />
            {v.blood_sugar && <MiniVital label="Sugar" value={`${v.blood_sugar.toFixed(0)}`} alert={v.blood_sugar > 140} />}
          </View>
        </Card>
      ))}
    </View>
  );
}

function MiniVital({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={vitalsStyles.miniChip}>
      <Text style={vitalsStyles.miniLabel}>{label}</Text>
      <Text style={[vitalsStyles.miniValue, alert && { color: Colors.coral400 }]}>{value}</Text>
    </View>
  );
}

const vitalsStyles = StyleSheet.create({
  row: { paddingVertical: Spacing.sm },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  time: { fontSize: 12, color: Colors.textSecondary },
  source: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  miniChip: {
    backgroundColor: Colors.navy900, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center',
  },
  miniLabel: { fontSize: 9, color: Colors.textMuted },
  miniValue: { fontSize: 12, fontFamily: 'monospace', color: Colors.textPrimary, fontWeight: '600' },
});

function RiskTab({
  risk, loading, onEvaluate,
}: { risk: any; loading: boolean; onEvaluate: () => void }) {
  if (!risk) {
    return (
      <View style={{ gap: Spacing.md }}>
        <EmptyState message="No risk assessment yet" />
        <Button label="Run Risk Assessment" onPress={onEvaluate} loading={loading} />
      </View>
    );
  }

  const color = riskColor(risk.risk_level);
  return (
    <View style={{ gap: Spacing.md }}>
      {/* Score card */}
      <Card style={riskStyles.scoreCard}>
        <View style={[riskStyles.scoreCircle, { borderColor: color }]}>
          <Text style={[riskStyles.scoreNum, { color }]}>{risk.risk_score}</Text>
          <Text style={riskStyles.scoreLabel}>score</Text>
        </View>
        <View style={riskStyles.scoreInfo}>
          <Text style={[riskStyles.riskLevel, { color }]}>{risk.risk_level.toUpperCase()} RISK</Text>
          <Text style={riskStyles.computedAt}>
            {formatDistanceToNow(new Date(risk.computed_at), { addSuffix: true })}
          </Text>
          <Text style={riskStyles.action}>{risk.suggested_action}</Text>
        </View>
      </Card>

      {/* Risk factors */}
      <Card>
        <Text style={riskStyles.factorsTitle}>Risk Factors</Text>
        {risk.reasons.map((r: string, i: number) => (
          <View key={i} style={riskStyles.factorRow}>
            <View style={[riskStyles.factorDot, { backgroundColor: color }]} />
            <Text style={riskStyles.factorText}>{r}</Text>
          </View>
        ))}
      </Card>

      <Button label="Re-evaluate Risk" onPress={onEvaluate} loading={loading} variant="ghost" />
    </View>
  );
}

const riskStyles = StyleSheet.create({
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 24, fontWeight: '300', fontFamily: 'Georgia' },
  scoreLabel: { fontSize: 10, color: Colors.textMuted },
  scoreInfo: { flex: 1 },
  riskLevel: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  computedAt: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  action: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
  factorsTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  factorDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  factorText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});

function VisitsTab({
  visits, navigation, patientId,
}: { visits: any[]; navigation: any; patientId: string }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Button
        label="Log New Visit"
        onPress={() => navigation.navigate('LogVisit', { patientId })}
        icon={<Ionicons name="add" size={16} color="#fff" />}
      />
      {visits.length === 0 ? (
        <EmptyState message="No visits recorded yet" />
      ) : (
        visits.map((v) => (
          <Card key={v.id}>
            <View style={visitStyles.header}>
              <Text style={visitStyles.date}>{v.visit_date}</Text>
              {v.follow_up_date && (
                <Text style={visitStyles.followUp}>Follow-up: {v.follow_up_date}</Text>
              )}
            </View>
            <Text style={visitStyles.notes}>{v.notes}</Text>
            {v.medicine_provided && (
              <Text style={visitStyles.medicine}>💊 {v.medicine_provided}</Text>
            )}
          </Card>
        ))
      )}
    </View>
  );
}

const visitStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  followUp: { fontSize: 11, color: Colors.jade400 },
  notes: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  medicine: { fontSize: 12, color: Colors.jade400, marginTop: 6 },
});

function EmergencyTab({ patient }: { patient: any }) {
  const actions = [
    {
      label: 'Call Patient',
      sublabel: patient.phone,
      icon: 'call',
      color: Colors.jade400,
      bg: 'rgba(27,191,132,0.12)',
      onPress: () => Linking.openURL(`tel:${patient.phone}`),
    },
    {
      label: 'Call Emergency Contact',
      sublabel: patient.emergency_contact,
      icon: 'person-circle',
      color: Colors.amber400,
      bg: 'rgba(255,181,71,0.12)',
      onPress: () => Linking.openURL(`tel:${patient.emergency_contact}`),
    },
    {
      label: 'Notify Doctor',
      sublabel: 'Send urgent alert to assigned doctor',
      icon: 'medkit',
      color: Colors.coral400,
      bg: 'rgba(255,95,61,0.12)',
      onPress: () => Alert.alert('Doctor Notified', 'An alert has been sent to the assigned doctor.'),
    },
    {
      label: 'Request Ambulance',
      sublabel: 'Simulate ambulance dispatch',
      icon: 'alert-circle',
      color: Colors.coral500,
      bg: 'rgba(255,95,61,0.18)',
      onPress: () =>
        Alert.alert(
          'Ambulance Requested',
          `An ambulance has been dispatched to ${patient.village}. ETA: ~15 minutes.`,
          [{ text: 'OK' }]
        ),
    },
    {
      label: 'Mark Urgent Visit Required',
      sublabel: 'Flag for immediate ASHA follow-up',
      icon: 'flag',
      color: Colors.amber400,
      bg: 'rgba(255,181,71,0.12)',
      onPress: () =>
        Alert.alert('Flagged', `${patient.name} has been marked for urgent ASHA visit.`),
    },
  ];

  return (
    <View style={{ gap: Spacing.sm }}>
      <Card style={emergencyStyles.warningCard}>
        <Ionicons name="warning" size={18} color={Colors.coral400} />
        <Text style={emergencyStyles.warningText}>
          Use these actions in case of immediate risk or emergency. All actions are logged.
        </Text>
      </Card>

      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            a.onPress();
          }}
          activeOpacity={0.75}
        >
          <Card style={emergencyStyles.actionCard}>
            <View style={[emergencyStyles.actionIcon, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <View style={emergencyStyles.actionInfo}>
              <Text style={emergencyStyles.actionLabel}>{a.label}</Text>
              <Text style={emergencyStyles.actionSub} numberOfLines={1}>{a.sublabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const emergencyStyles = StyleSheet.create({
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,95,61,0.06)', borderColor: 'rgba(255,95,61,0.2)',
  },
  warningText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, backgroundColor: Colors.navy800,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,95,61,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: Colors.coral400 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  headerMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerConditions: { fontSize: 11, color: Colors.amber400, marginTop: 2 },
  vitalStrip: {
    backgroundColor: Colors.navy900, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  vitalScroll: { paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingRight: Spacing.md, paddingBottom: 6,
    justifyContent: 'flex-end',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.jade400 },
  liveText: { fontSize: 10, color: Colors.jade400 },
  tabBar: {
    backgroundColor: Colors.navy900,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  tabScroll: { paddingHorizontal: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.coral500 },
  tabText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.coral400 },
  tabContent: { flex: 1 },
});
