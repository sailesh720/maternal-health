import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Bell } from 'lucide-react'
import { alertsApi } from '../services/api'
import { SeverityBadge, StatusBadge, PageHeader, Spinner, EmptyState } from '../components/ui'
import type { Alert } from '../types'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_blood_pressure: 'High Blood Pressure',
  abnormal_heart_rate: 'Abnormal Heart Rate',
  no_activity_detected: 'No Activity Detected',
  missed_checkup: 'Missed Checkup',
  temperature_spike: 'Temperature Spike',
  low_oxygen: 'Low Oxygen Level',
}

export function AlertsPage() {
  const qc = useQueryClient()
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [village, setVillage] = useState('')

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severity, status, village],
    queryFn: () => alertsApi.list({
      ...(severity && { severity }),
      ...(status && { status }),
      ...(village && { village }),
      limit: '100',
    }),
    refetchInterval: 15000,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert acknowledged')
    },
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert resolved')
    },
  })

  const newCount = (alerts ?? []).filter((a: Alert) => a.status === 'new').length
  const highCount = (alerts ?? []).filter((a: Alert) => a.severity === 'high').length

  return (
    <div className="p-6 space-y-5 animate-fade-up">
      <PageHeader
        title="Alerts"
        subtitle="Manage and respond to patient health alerts"
        action={
          <div className="flex gap-3">
            {newCount > 0 && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">
                <Bell size={14} />
                {newCount} new
              </span>
            )}
          </div>
        }
      />

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="card px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-coral-400" />
          <span className="text-sm text-slate-300">{highCount} critical</span>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm text-slate-300">{(alerts ?? []).filter((a: Alert) => a.severity === 'medium').length} medium</span>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-jade-400" />
          <span className="text-sm text-slate-300">{(alerts ?? []).filter((a: Alert) => a.status === 'resolved').length} resolved</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-field w-36">
          <option value="">All severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-40">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <input
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          placeholder="Filter by village…"
          className="input-field w-48"
        />
      </div>

      {/* Alerts list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (alerts ?? []).length === 0 ? (
        <EmptyState message="No alerts match your filters" />
      ) : (
        <div className="space-y-2">
          {(alerts as Alert[]).map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
              onResolve={() => resolveMutation.mutate(alert.id)}
              loading={acknowledgeMutation.isPending || resolveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertRow({
  alert: a, onAcknowledge, onResolve, loading,
}: {
  alert: Alert
  onAcknowledge: () => void
  onResolve: () => void
  loading: boolean
}) {
  const borderColor = {
    high: 'border-l-coral-500',
    medium: 'border-l-amber-400',
    low: 'border-l-jade-500',
  }[a.severity]

  return (
    <div className={clsx('card p-4 border-l-2 flex items-start gap-4', borderColor)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-slate-200">
            {ALERT_TYPE_LABELS[a.alert_type] ?? a.alert_type}
          </span>
          <SeverityBadge severity={a.severity} />
          <StatusBadge status={a.status} />
        </div>
        <p className="text-sm text-slate-400">{a.message}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-slate-600">
            👤 {a.patient_name ?? 'Unknown patient'}
          </span>
          <span className="text-xs text-slate-600">
            🕒 {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
          </span>
          <span className="text-xs text-slate-500 italic">{a.suggested_action}</span>
        </div>
      </div>

      {/* Actions */}
      {a.status !== 'resolved' && (
        <div className="flex gap-2 flex-shrink-0">
          {a.status === 'new' && (
            <button
              onClick={onAcknowledge}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <CheckCircle size={13} /> Acknowledge
            </button>
          )}
          <button
            onClick={onResolve}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-jade-500/10 text-jade-400 border border-jade-500/20 hover:bg-jade-500/20 transition-colors"
          >
            <XCircle size={13} /> Resolve
          </button>
        </div>
      )}
    </div>
  )
}
