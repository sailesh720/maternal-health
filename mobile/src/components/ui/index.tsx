import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, StyleProp,
} from 'react-native';
import { Colors, Radius, Spacing, Shadow, riskColor, riskBg } from '../../utils/theme';
import type { RiskLevel } from '../../types';

// ── Card ─────────────────────────────────────────
export function Card({
  children, style,
}: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Risk Badge ────────────────────────────────────
export function RiskBadge({ level }: { level?: RiskLevel | null }) {
  if (!level) return null;
  const color = riskColor(level);
  const bg = riskBg(level);
  const labels: Record<RiskLevel, string> = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '50' }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{labels[level]}</Text>
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  sublabel?: string;
}

export function StatCard({ label, value, iconBg, iconColor, icon, sublabel }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </Card>
  );
}

// ── Button ────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label, onPress, variant = 'primary', disabled, loading, icon, style,
}: ButtonProps) {
  const variantStyle = {
    primary: styles.btnPrimary,
    ghost: styles.btnGhost,
    danger: styles.btnDanger,
  }[variant];
  const textStyle = {
    primary: styles.btnPrimaryText,
    ghost: styles.btnGhostText,
    danger: styles.btnDangerText,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, variantStyle, (disabled || loading) && styles.btnDisabled, style]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? Colors.textSecondary : '#fff'} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Vital Chip ────────────────────────────────────
interface VitalChipProps {
  label: string;
  value: string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
}

export function VitalChip({ label, value, unit, status = 'normal' }: VitalChipProps) {
  const statusColor = {
    normal: Colors.textSecondary,
    warning: Colors.amber400,
    critical: Colors.coral500,
  }[status];

  return (
    <View style={styles.vitalChip}>
      <Text style={styles.vitalChipLabel}>{label}</Text>
      <Text style={[styles.vitalChipValue, { color: statusColor }]}>{value}</Text>
      <Text style={styles.vitalChipUnit}>{unit}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

// ── Loading Screen ────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={Colors.coral500} />
    </View>
  );
}

// ── Empty State ───────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy800,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadow.card,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  statSublabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  btnPrimary: {
    backgroundColor: Colors.coral500,
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.borderMedium,
  },
  btnDanger: {
    backgroundColor: 'rgba(255,95,61,0.15)',
    borderWidth: 1,
    borderColor: Colors.coral500 + '40',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnGhostText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 15 },
  btnDangerText: { color: Colors.coral500, fontWeight: '600', fontSize: 15 },
  vitalChip: {
    alignItems: 'center',
    backgroundColor: Colors.navy900,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 72,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  vitalChipLabel: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  vitalChipValue: { fontSize: 16, fontWeight: '600', fontFamily: 'monospace', marginVertical: 2 },
  vitalChipUnit: { fontSize: 9, color: Colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.navy950,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
});
