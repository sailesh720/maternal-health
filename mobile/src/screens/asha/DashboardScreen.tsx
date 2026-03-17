import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, alertsApi } from '../../services/api';
import { Card, StatCard, RiskBadge, SectionHeader, EmptyState } from '../../components/ui';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { useVitalsStream } from '../../hooks/useVitalsStream';
import { formatDistanceToNow } from 'date-fns';

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { connected } = useVitalsStream();

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30000,
  });

  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts-new'],
    queryFn: () => alertsApi.list({ status: 'new', limit: '5' }),
    refetchInterval: 20000,
  });

  const { data: highRisk } = useQuery({
    queryKey: ['high-risk-patients'],
    queryFn: dashboardApi.highRisk,
    refetchInterval: 30000,
  });

  const refreshing = loadingSummary;
  const onRefresh = () => { refetchSummary(); refetchAlerts(); };

  const newAlerts = (alerts ?? []).filter((a: any) => a.status === 'new');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.coral500} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={[styles.liveDot, { backgroundColor: connected ? Colors.jade400 : Colors.textMuted }]} />
          <Text style={styles.liveText}>{connected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {/* Stat grid */}
      <View style={styles.statGrid}>
        <StatCard
          label="Patients"
          value={summary?.total_patients ?? '—'}
          iconBg="rgba(96,165,250,0.12)"
          iconColor={Colors.jade400}
          icon={<Ionicons name="people" size={20} color="#60a5fa" />}
          sublabel={`${summary?.total_villages ?? 0} villages`}
        />
        <StatCard
          label="High Risk"
          value={summary?.high_risk_count ?? '—'}
          iconBg="rgba(255,95,61,0.12)"
          iconColor={Colors.coral400}
          icon={<Ionicons name="warning" size={20} color={Colors.coral500} />}
        />
      </View>
      <View style={styles.statGrid}>
        <StatCard
          label="Alerts Today"
          value={summary?.alerts_today ?? '—'}
          iconBg="rgba(255,181,71,0.12)"
          iconColor={Colors.amber400}
          icon={<Ionicons name="notifications" size={20} color={Colors.amber400} />}
        />
        <StatCard
          label="Checkups"
          value={summary?.upcoming_checkups ?? '—'}
          iconBg="rgba(27,191,132,0.12)"
          iconColor={Colors.jade400}
          icon={<Ionicons name="calendar" size={20} color={Colors.jade400} />}
          sublabel="Next 7 days"
        />
      </View>

      {/* New alerts */}
      <SectionHeader
        title={`Alerts (${newAlerts.length} new)`}
        action={
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        }
      />
      {newAlerts.length === 0 ? (
        <Card><Text style={styles.allClearText}>✓ No new alerts</Text></Card>
      ) : (
        newAlerts.slice(0, 3).map((alert: any) => (
          <AlertRow key={alert.id} alert={alert} />
        ))
      )}

      {/* High-risk patients */}
      <SectionHeader
        title="High-Risk Patients"
        action={
          <TouchableOpacity onPress={() => navigation.navigate('Patients', { riskFilter: 'high' })}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        }
      />
      {(highRisk ?? []).length === 0 ? (
        <EmptyState message="No high-risk patients" />
      ) : (
        (highRisk ?? []).slice(0, 4).map((p: any) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
          >
            <Card style={styles.patientCard}>
              <View style={styles.patientRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>Wk {p.pregnancy_week} · {p.village}</Text>
                </View>
                <View style={styles.patientRight}>
                  <RiskBadge level="high" />
                  <Text style={styles.riskScore}>{p.risk_score}</Text>
                </View>
              </View>
              {p.reasons?.[0] && (
                <Text style={styles.riskReason} numberOfLines={1}>
                  › {p.reasons[0]}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function AlertRow({ alert }: { alert: any }) {
  const severityColor = { high: Colors.coral500, medium: Colors.amber400, low: Colors.jade500 }[alert.severity as string] ?? Colors.textMuted;
  return (
    <Card style={[styles.alertCard, { borderLeftColor: severityColor }]}>
      <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
      <View style={styles.alertMeta}>
        <Text style={[styles.alertSeverity, { color: severityColor }]}>{alert.severity.toUpperCase()}</Text>
        <Text style={styles.alertTime}>
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </Text>
      </View>
      {alert.patient_name && (
        <Text style={styles.alertPatient}>👤 {alert.patient_name}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy950 },
  content: { padding: Spacing.md, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: 13, color: Colors.textMuted },
  userName: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Georgia' },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.navy800, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, color: Colors.textMuted },
  statGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  seeAll: { fontSize: 12, color: Colors.coral400 },
  allClearText: { color: Colors.jade400, textAlign: 'center', paddingVertical: 4 },
  alertCard: {
    marginBottom: Spacing.sm, borderLeftWidth: 3,
    borderLeftColor: Colors.coral500,
  },
  alertMessage: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  alertMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  alertSeverity: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  alertTime: { fontSize: 11, color: Colors.textMuted },
  alertPatient: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  patientCard: { marginBottom: Spacing.sm },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,95,61,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: Colors.coral400 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  patientMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  patientRight: { alignItems: 'flex-end', gap: 4 },
  riskScore: { fontSize: 13, color: Colors.coral400, fontFamily: 'monospace', fontWeight: '600' },
  riskReason: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
});
