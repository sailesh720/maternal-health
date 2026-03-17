import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search } from 'lucide-react'
import { patientsApi } from '../services/api'
import { RiskBadge, PageHeader, Spinner, EmptyState } from '../components/ui'
import type { Patient } from '../types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export function PatientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [villageFilter, setVillageFilter] = useState('')

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
    refetchInterval: 60000,
  })

  const villages: string[] = [...new Set<string>((patients ?? []).map((p: Patient) => p.village))]

  const filtered = (patients ?? []).filter((p: Patient) => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.village.toLowerCase().includes(q) || p.phone.includes(q)
    const matchRisk = !riskFilter || p.risk_level === riskFilter
    const matchVillage = !villageFilter || p.village === villageFilter
    return matchSearch && matchRisk && matchVillage
  })

  return (
    <div className="p-6 space-y-5 animate-fade-up">
      <PageHeader
        title="Patients"
        subtitle={`${patients?.length ?? 0} registered mothers`}
        action={
          <button
            onClick={() => navigate('/patients/new')}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={15} />
            Register Patient
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, village, phone…"
            className="input-field pl-8 w-64"
          />
        </div>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="input-field w-40">
          <option value="">All risk levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
        <select value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)} className="input-field w-40">
          <option value="">All villages</option>
          {villages.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No patients match your filters" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: Patient) => (
            <PatientCard key={p.id} patient={p} onClick={() => navigate(`/patients/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientCard({ patient: p, onClick }: { patient: Patient; onClick: () => void }) {
  const riskBg = {
    high:   'border-l-coral-500',
    medium: 'border-l-amber-400',
    low:    'border-l-jade-400',
  }[p.risk_level ?? 'low'] ?? 'border-l-slate-700'

  return (
    <div
      onClick={onClick}
      className={clsx(
        'card p-4 border-l-2 cursor-pointer hover:bg-navy-700/60 transition-all hover:shadow-card-hover',
        riskBg
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-slate-100">{p.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{p.village} · Age {p.age}</p>
        </div>
        <RiskBadge level={p.risk_level} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-navy-900 rounded-lg py-2">
          <p className="text-xs text-slate-500">Week</p>
          <p className="text-sm font-mono text-slate-200 font-medium">{p.pregnancy_week}</p>
        </div>
        <div className="bg-navy-900 rounded-lg py-2">
          <p className="text-xs text-slate-500">Conditions</p>
          <p className="text-sm font-mono text-slate-200 font-medium">{p.medical_conditions.length}</p>
        </div>
        <div className="bg-navy-900 rounded-lg py-2">
          <p className="text-xs text-slate-500">Device</p>
          <p className="text-sm font-mono text-slate-200 font-medium">{p.device_id ? '✓' : '—'}</p>
        </div>
      </div>

      {p.last_vitals_update && (
        <p className="text-xs text-slate-600 mt-3 text-right">
          Updated {formatDistanceToNow(new Date(p.last_vitals_update), { addSuffix: true })}
        </p>
      )}
    </div>
  )
}
