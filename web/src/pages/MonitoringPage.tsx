import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientsApi, vitalsApi } from '../services/api'
import { useVitalsStream } from '../hooks/useVitalsStream'
import { RiskBadge, PageHeader, VitalChip, Spinner } from '../components/ui'
import type { Patient, Vital } from '../types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

function vitalStatus(key: string, val: number): 'normal' | 'warning' | 'critical' {
  const rules: Record<string, [number, number, number, number]> = {
    heart_rate:   [55, 100, 110, 130],
    systolic_bp:  [90, 129, 139, 160],
    diastolic_bp: [60, 84, 89, 110],
    temperature:  [36.0, 37.4, 38.0, 39.0],
    oxygen_level: [100, 100, 96, 94],
  }
  if (!rules[key]) return 'normal'
  const [, warnLow, critLow, critHigh] = rules[key]
  if (key === 'oxygen_level') {
    if (val < critHigh) return 'critical'
    if (val < critLow) return 'warning'
    return 'normal'
  }
  if (val >= critHigh || val < warnLow * 0.8) return 'critical'
  if (val >= critLow) return 'warning'
  return 'normal'
}

export function MonitoringPage() {
  const { liveVitals, connected } = useVitalsStream()
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
    refetchInterval: 60000,
  })

  const { data: liveVitalsSnapshot } = useQuery({
    queryKey: ['vitals-live'],
    queryFn: vitalsApi.live,
    refetchInterval: 30000,
  })

  // Merge API snapshot with WS updates
  const [vitalsMap, setVitalsMap] = useState<Record<string, Vital>>({})
  useEffect(() => {
    if (!liveVitalsSnapshot) return
    const map: Record<string, Vital> = {}
    for (const v of liveVitalsSnapshot) map[v.patient_id] = v
    setVitalsMap(map)
  }, [liveVitalsSnapshot])

  useEffect(() => {
    setVitalsMap((prev) => {
      const next = { ...prev }
      for (const [pid, update] of Object.entries(liveVitals)) {
        next[pid] = {
          ...(prev[pid] || {}),
          patient_id: pid,
          heart_rate: update.vitals.heart_rate,
          systolic_bp: update.vitals.systolic_bp,
          diastolic_bp: update.vitals.diastolic_bp,
          temperature: update.vitals.temperature,
          oxygen_level: update.vitals.oxygen_level,
          activity_level: update.vitals.activity_level,
          blood_sugar: update.vitals.blood_sugar,
          timestamp: update.timestamp,
        } as Vital
      }
      return next
    })
  }, [liveVitals])

  const filtered = (patients ?? []).filter((p: Patient) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase())
    const matchRisk = !riskFilter || p.risk_level === riskFilter
    return matchSearch && matchRisk
  })

  return (
    <div className="p-6 space-y-5 animate-fade-up">
      <PageHeader
        title="Live Monitor"
        subtitle="Real-time wearable vitals across all patients"
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800 border border-white/5">
            <span className={clsx('w-2 h-2 rounded-full live-dot', connected ? 'bg-jade-400' : 'bg-slate-600')} />
            <span className="text-xs text-slate-400">{connected ? 'Live' : 'Reconnecting…'}</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient or village…"
          className="input-field max-w-xs"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="input-field w-40"
        >
          <option value="">All risk levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-navy-900">
                <th className="table-header text-left">Patient</th>
                <th className="table-header text-left">Village</th>
                <th className="table-header text-center">HR (bpm)</th>
                <th className="table-header text-center">BP (mmHg)</th>
                <th className="table-header text-center">Temp (°C)</th>
                <th className="table-header text-center">SpO₂ (%)</th>
                <th className="table-header text-center">Risk</th>
                <th className="table-header text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12"><Spinner /></td></tr>
              ) : filtered.map((p: Patient) => {
                const v = vitalsMap[p.id]
                const wsUpdate = liveVitals[p.id]
                const isRecent = wsUpdate && Date.now() - new Date(wsUpdate.timestamp).getTime() < 60000
                const risk = wsUpdate?.risk_level || p.risk_level

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPatient(selectedPatient === p.id ? null : p.id)}
                    className={clsx(
                      'cursor-pointer transition-colors',
                      selectedPatient === p.id ? 'bg-navy-700/50' : 'hover:bg-navy-800/50',
                      isRecent && 'animate-slide-in'
                    )}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        {isRecent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-jade-400 live-dot flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-slate-200">{p.name}</p>
                          <p className="text-xs text-slate-500">Wk {p.pregnancy_week}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-slate-400">{p.village}</td>
                    <td className={clsx('table-cell text-center font-mono', v && vitalStatus('heart_rate', v.heart_rate) === 'critical' ? 'text-coral-400' : vitalStatus('heart_rate', v?.heart_rate ?? 80) === 'warning' ? 'text-amber-400' : 'text-slate-300')}>
                      {v ? v.heart_rate.toFixed(0) : '—'}
                    </td>
                    <td className={clsx('table-cell text-center font-mono', v && vitalStatus('systolic_bp', v.systolic_bp) === 'critical' ? 'text-coral-400' : vitalStatus('systolic_bp', v?.systolic_bp ?? 120) === 'warning' ? 'text-amber-400' : 'text-slate-300')}>
                      {v ? `${v.systolic_bp.toFixed(0)}/${v.diastolic_bp.toFixed(0)}` : '—'}
                    </td>
                    <td className={clsx('table-cell text-center font-mono', v && vitalStatus('temperature', v.temperature) === 'critical' ? 'text-coral-400' : vitalStatus('temperature', v?.temperature ?? 37) === 'warning' ? 'text-amber-400' : 'text-slate-300')}>
                      {v ? v.temperature.toFixed(1) : '—'}
                    </td>
                    <td className={clsx('table-cell text-center font-mono', v && vitalStatus('oxygen_level', v.oxygen_level) === 'critical' ? 'text-coral-400' : vitalStatus('oxygen_level', v?.oxygen_level ?? 98) === 'warning' ? 'text-amber-400' : 'text-slate-300')}>
                      {v ? v.oxygen_level.toFixed(0) : '—'}
                    </td>
                    <td className="table-cell text-center">
                      <RiskBadge level={risk} />
                    </td>
                    <td className="table-cell text-right text-slate-500 text-xs">
                      {v ? formatDistanceToNow(new Date(v.timestamp), { addSuffix: true }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-600 text-right">
        Showing {filtered.length} of {patients?.length ?? 0} patients
      </p>
    </div>
  )
}
