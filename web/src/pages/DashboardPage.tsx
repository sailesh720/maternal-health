import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle, Bell, Calendar, MapPin, Activity } from 'lucide-react'
import { dashboardApi } from '../services/api'
import { StatCard, RiskBadge, PageHeader, Spinner } from '../components/ui'
import { TrendsChart, RiskPieChart, VillageBarChart } from '../components/charts'
import type { VillageRisk } from '../types'
import { formatDistanceToNow } from 'date-fns'

export function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30000,
  })

  const { data: trends } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: dashboardApi.trends,
    refetchInterval: 60000,
  })

  const { data: villageRisk } = useQuery({
    queryKey: ['village-risk'],
    queryFn: dashboardApi.villageRisk,
    refetchInterval: 60000,
  })

  const { data: highRisk } = useQuery({
    queryKey: ['high-risk-patients'],
    queryFn: dashboardApi.highRisk,
    refetchInterval: 30000,
  })

  const riskPieData = summary ? [
    { name: 'High Risk',   value: summary.high_risk_count   },
    { name: 'Medium Risk', value: summary.medium_risk_count },
    { name: 'Low Risk',    value: summary.low_risk_count    },
  ] : []

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <PageHeader
        title="Overview"
        subtitle="Real-time maternal health monitoring across all regions"
      />

      {/* ── Stat cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Mothers"
          value={summary?.total_patients ?? 0}
          icon={<Users size={18} />}
          accent="blue"
          sublabel={`${summary?.total_villages} villages`}
        />
        <StatCard
          label="High Risk"
          value={summary?.high_risk_count ?? 0}
          icon={<AlertTriangle size={18} />}
          accent="coral"
          sublabel="Immediate attention"
        />
        <StatCard
          label="Alerts Today"
          value={summary?.alerts_today ?? 0}
          icon={<Bell size={18} />}
          accent="amber"
        />
        <StatCard
          label="Upcoming Checkups"
          value={summary?.upcoming_checkups ?? 0}
          icon={<Calendar size={18} />}
          accent="jade"
          sublabel="Next 7 days"
        />
      </div>

      {/* ── Charts row ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trends */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Alert Trends — Last 7 Days</h3>
          {trends ? <TrendsChart data={trends} /> : <div className="h-48 flex items-center justify-center"><Spinner /></div>}
        </div>

        {/* Risk distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Risk Distribution</h3>
          {riskPieData.length > 0 ? (
            <RiskPieChart data={riskPieData} />
          ) : (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          )}
        </div>
      </div>

      {/* ── Village risk bar + high-risk patients ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Village bar */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Risk by Village</h3>
          {villageRisk ? (
            <VillageBarChart data={villageRisk} />
          ) : (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          )}
        </div>

        {/* High risk patients */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">
            High-Risk Patients
            <span className="ml-2 text-xs text-coral-400 bg-coral-500/10 px-2 py-0.5 rounded-full">
              {highRisk?.length ?? 0}
            </span>
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {highRisk?.slice(0, 8).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 transition-colors">
                <div className="w-7 h-7 rounded-full bg-coral-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-coral-400 font-medium">{p.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">Wk {p.pregnancy_week} · {p.village}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono text-coral-400">{p.risk_score}</p>
                  <p className="text-xs text-slate-600">score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
