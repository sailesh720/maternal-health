import clsx from 'clsx'
import type { RiskLevel, AlertSeverity, AlertStatus } from '../../types'

// ── Stat Card ─────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: 'coral' | 'jade' | 'amber' | 'blue'
  sublabel?: string
  trend?: number
}

export function StatCard({ label, value, icon, accent = 'coral', sublabel, trend }: StatCardProps) {
  const accentMap = {
    coral: 'text-coral-400 bg-coral-500/10 border-coral-500/20',
    jade:  'text-jade-400 bg-jade-500/10 border-jade-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="stat-value mt-1.5 text-white">{value}</p>
          {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-lg border', accentMap[accent])}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <p className={clsx('text-xs mt-3', trend >= 0 ? 'text-coral-400' : 'text-jade-400')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
        </p>
      )}
    </div>
  )
}

// ── Risk Badge ────────────────────────────────────
export function RiskBadge({ level }: { level?: RiskLevel | null }) {
  if (!level) return <span className="text-slate-600 text-xs">—</span>
  const map = {
    high:   { cls: 'badge-high',   dot: 'bg-coral-400', label: 'High' },
    medium: { cls: 'badge-medium', dot: 'bg-amber-400',  label: 'Medium' },
    low:    { cls: 'badge-low',    dot: 'bg-jade-400',   label: 'Low' },
  }
  const { cls, dot, label } = map[level]
  return (
    <span className={cls}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

// ── Severity Badge ────────────────────────────────
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map = {
    high:   'badge-high',
    medium: 'badge-medium',
    low:    'badge-low',
  }
  return <span className={map[severity]}>{severity}</span>
}

// ── Alert Status Badge ────────────────────────────
export function StatusBadge({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, string> = {
    new:          'bg-coral-500/15 text-coral-400 border-coral-500/20',
    acknowledged: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    resolved:     'bg-jade-500/15 text-jade-400 border-jade-500/20',
  }
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', map[status])}>
      {status}
    </span>
  )
}

// ── Vital Chip ────────────────────────────────────
interface VitalChipProps {
  label: string
  value: number | string
  unit: string
  status?: 'normal' | 'warning' | 'critical'
}

export function VitalChip({ label, value, unit, status = 'normal' }: VitalChipProps) {
  const statusMap = {
    normal:   'border-white/8 text-slate-200',
    warning:  'border-amber-500/30 text-amber-400',
    critical: 'border-coral-500/40 text-coral-400',
  }
  return (
    <div className={clsx('flex flex-col items-center px-3 py-2 rounded-lg border bg-navy-900', statusMap[status])}>
      <span className="text-xs text-slate-500 mb-0.5">{label}</span>
      <span className="text-base font-mono font-medium">{value}</span>
      <span className="text-xs text-slate-600">{unit}</span>
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-coral-500"
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Page Header ───────────────────────────────────
export function PageHeader({
  title, subtitle, action
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-light text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Empty State ───────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mb-3">
        <span className="text-2xl">🌿</span>
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}
