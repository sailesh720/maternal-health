import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, AlertTriangle, Activity, ClipboardList, Heart } from 'lucide-react'
import { patientsApi, riskApi } from '../services/api'
import { RiskBadge, VitalChip, Spinner } from '../components/ui'
import { TrendsChart } from '../components/charts'
import type { Vital } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type Tab = 'overview' | 'vitals' | 'risk' | 'visits' | 'alerts'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  })

  const { data: vitals } = useQuery({
    queryKey: ['patient-vitals', id],
    queryFn: () => patientsApi.vitals(id!, 30),
    enabled: !!id,
    refetchInterval: 30000,
  })

  const { data: risk } = useQuery({
    queryKey: ['patient-risk', id],
    queryFn: () => patientsApi.risk(id!),
    enabled: !!id,
  })

  const { data: visits } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: () => patientsApi.visits(id!),
    enabled: !!id,
  })

  const { data: alerts } = useQuery({
    queryKey: ['patient-alerts', id],
    queryFn: () => patientsApi.alerts(id!),
    enabled: !!id,
  })

  const evaluateMutation = useMutation({
    mutationFn: () => riskApi.evaluate(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-risk', id] })
      qc.invalidateQueries({ queryKey: ['patient', id] })
      toast.success('Risk assessment updated')
    },
  })

  if (isLoading || !patient) {
    return <div className="flex justify-center py-24"><Spinner size={28} /></div>
  }

  const latestVital: Vital | undefined = vitals?.[0]

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview',  icon: <Heart size={14} /> },
    { key: 'vitals',   label: 'Vitals',    icon: <Activity size={14} /> },
    { key: 'risk',     label: 'Risk',      icon: <AlertTriangle size={14} /> },
    { key: 'visits',   label: 'Visits',    icon: <ClipboardList size={14} /> },
    { key: 'alerts',   label: 'Alerts',    icon: <AlertTriangle size={14} /> },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 px-3">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-light text-white">{patient.name}</h1>
            <RiskBadge level={patient.risk_level} />
          </div>
          <p className="text-sm text-slate-500">{patient.village}, {patient.district} · Age {patient.age} · Week {patient.pregnancy_week}</p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${patient.phone}`} className="btn-ghost flex items-center gap-2">
            <Phone size={14} /> {patient.phone}
          </a>
          <button
            onClick={() => evaluateMutation.mutate()}
            disabled={evaluateMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {evaluateMutation.isPending ? <Spinner size={14} /> : <Activity size={14} />}
            Evaluate Risk
          </button>
        </div>
      </div>

      {/* Latest vitals strip */}
      {latestVital && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Latest Vitals</p>
            <p className="text-xs text-slate-600">{format(new Date(latestVital.timestamp), 'MMM d, HH:mm')}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <VitalChip label="Heart Rate" value={latestVital.heart_rate.toFixed(0)} unit="bpm"
              status={latestVital.heart_rate > 110 ? 'critical' : latestVital.heart_rate > 95 ? 'warning' : 'normal'} />
            <VitalChip label="Blood Pressure" value={`${latestVital.systolic_bp.toFixed(0)}/${latestVital.diastolic_bp.toFixed(0)}`} unit="mmHg"
              status={latestVital.systolic_bp >= 140 ? 'critical' : latestVital.systolic_bp >= 130 ? 'warning' : 'normal'} />
            <VitalChip label="Temperature" value={latestVital.temperature.toFixed(1)} unit="°C"
              status={latestVital.temperature >= 39 ? 'critical' : latestVital.temperature >= 38 ? 'warning' : 'normal'} />
            <VitalChip label="SpO₂" value={latestVital.oxygen_level.toFixed(0)} unit="%"
              status={latestVital.oxygen_level < 90 ? 'critical' : latestVital.oxygen_level < 94 ? 'warning' : 'normal'} />
            <VitalChip label="Activity" value={latestVital.activity_level.toFixed(0)} unit="score" />
            {latestVital.blood_sugar && (
              <VitalChip label="Blood Sugar" value={latestVital.blood_sugar.toFixed(0)} unit="mg/dL"
                status={latestVital.blood_sugar > 180 ? 'critical' : latestVital.blood_sugar > 140 ? 'warning' : 'normal'} />
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-900 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all',
              tab === key
                ? 'bg-navy-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab patient={patient} />}
      {tab === 'vitals' && <VitalsTab vitals={vitals ?? []} />}
      {tab === 'risk' && <RiskTab risk={risk} />}
      {tab === 'visits' && <VisitsTab visits={visits ?? []} />}
      {tab === 'alerts' && <AlertsTab alerts={alerts ?? []} />}
    </div>
  )
}

function OverviewTab({ patient }: { patient: any }) {
  const sections = [
    {
      title: 'Personal Information',
      rows: [
        ['Name', patient.name],
        ['Age', patient.age],
        ['Phone', patient.phone],
        ['Emergency Contact', patient.emergency_contact],
      ],
    },
    {
      title: 'Pregnancy Details',
      rows: [
        ['Current Week', `Week ${patient.pregnancy_week}`],
        ['Expected Due Date', patient.expected_due_date],
        ['Village', patient.village],
        ['District', patient.district],
      ],
    },
    {
      title: 'Medical History',
      rows: [
        ['Known Conditions', patient.medical_conditions.length ? patient.medical_conditions.join(', ') : 'None'],
        ['Device ID', patient.device_id ?? 'Not assigned'],
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sections.map(({ title, rows }) => (
        <div key={title} className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 pb-2 border-b border-white/5">{title}</h3>
          <dl className="space-y-3">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-sm text-slate-200 mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

function VitalsTab({ vitals }: { vitals: Vital[] }) {
  const chartData = [...vitals].reverse().slice(-14).map((v) => ({
    date: format(new Date(v.timestamp), 'MM/dd HH:mm'),
    total_alerts: v.heart_rate,
    high_severity: v.systolic_bp,
  }))

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Heart Rate & Systolic BP Trend</h3>
        <TrendsChart data={chartData} />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-navy-900">
              <th className="table-header text-left">Time</th>
              <th className="table-header text-center">HR</th>
              <th className="table-header text-center">BP</th>
              <th className="table-header text-center">Temp</th>
              <th className="table-header text-center">SpO₂</th>
              <th className="table-header text-center">Sugar</th>
              <th className="table-header text-left">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vitals.slice(0, 20).map((v) => (
              <tr key={v.id} className="hover:bg-navy-800/40">
                <td className="table-cell text-xs text-slate-500">{format(new Date(v.timestamp), 'MMM d, HH:mm')}</td>
                <td className={clsx('table-cell text-center font-mono text-sm', v.heart_rate > 110 ? 'text-coral-400' : 'text-slate-300')}>{v.heart_rate.toFixed(0)}</td>
                <td className={clsx('table-cell text-center font-mono text-sm', v.systolic_bp >= 140 ? 'text-coral-400' : v.systolic_bp >= 130 ? 'text-amber-400' : 'text-slate-300')}>{v.systolic_bp.toFixed(0)}/{v.diastolic_bp.toFixed(0)}</td>
                <td className={clsx('table-cell text-center font-mono text-sm', v.temperature >= 38 ? 'text-amber-400' : 'text-slate-300')}>{v.temperature.toFixed(1)}</td>
                <td className={clsx('table-cell text-center font-mono text-sm', v.oxygen_level < 94 ? 'text-coral-400' : 'text-slate-300')}>{v.oxygen_level.toFixed(0)}%</td>
                <td className="table-cell text-center font-mono text-sm text-slate-400">{v.blood_sugar?.toFixed(0) ?? '—'}</td>
                <td className="table-cell"><span className="text-xs text-slate-600">{v.source}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RiskTab({ risk }: { risk: any }) {
  if (!risk) return <div className="card p-8 text-center text-slate-500">No risk assessment available.</div>
  const levelColor = { high: 'text-coral-400', medium: 'text-amber-400', low: 'text-jade-400' }[risk.risk_level as string] ?? 'text-slate-400'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Risk Assessment</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center" style={{ borderColor: 'currentColor' }}>
            <span className={clsx('text-2xl font-display font-semibold', levelColor)}>{risk.risk_score}</span>
          </div>
          <div>
            <p className={clsx('text-xl font-display capitalize', levelColor)}>{risk.risk_level} Risk</p>
            <p className="text-xs text-slate-500">{format(new Date(risk.computed_at), 'MMM d, HH:mm')}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 bg-navy-900 rounded-lg p-3">{risk.suggested_action}</p>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Risk Factors</h3>
        <ul className="space-y-2">
          {risk.reasons.map((r: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-coral-500 mt-0.5 flex-shrink-0">›</span> {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function VisitsTab({ visits }: { visits: any[] }) {
  if (!visits.length) return <div className="card p-8 text-center text-slate-500">No visits recorded yet.</div>
  return (
    <div className="space-y-3">
      {visits.map((v) => (
        <div key={v.id} className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="font-medium text-slate-200">{v.visit_date}</p>
            {v.follow_up_date && <p className="text-xs text-slate-500">Follow-up: {v.follow_up_date}</p>}
          </div>
          <p className="text-sm text-slate-400">{v.notes}</p>
          {v.medicine_provided && (
            <p className="text-xs text-jade-400 mt-2">💊 {v.medicine_provided}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function AlertsTab({ alerts }: { alerts: any[] }) {
  if (!alerts.length) return <div className="card p-8 text-center text-slate-500">No alerts for this patient.</div>
  const severityColor = { high: 'border-l-coral-500', medium: 'border-l-amber-400', low: 'border-l-jade-400' }
  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className={clsx('card p-4 border-l-2', severityColor[a.severity as keyof typeof severityColor])}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-200">{a.message}</p>
            <span className="text-xs text-slate-500">{format(new Date(a.created_at), 'MMM d, HH:mm')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{a.suggested_action}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full', a.status === 'resolved' ? 'text-jade-400 bg-jade-500/10' : a.status === 'acknowledged' ? 'text-amber-400 bg-amber-500/10' : 'text-coral-400 bg-coral-500/10')}>
              {a.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
