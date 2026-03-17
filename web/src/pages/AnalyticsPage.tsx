import { useQuery } from '@tanstack/react-query'
import { dashboardApi, riskApi } from '../services/api'
import { PageHeader, RiskBadge, Spinner } from '../components/ui'
import { TrendsChart, RiskPieChart } from '../components/charts'

export function AnalyticsPage() {
  const { data: summary } = useQuery({ queryKey: ['dashboard-summary'], queryFn: dashboardApi.summary, refetchInterval: 60000 })
  const { data: trends } = useQuery({ queryKey: ['dashboard-trends'], queryFn: dashboardApi.trends, refetchInterval: 60000 })
  const { data: highRisk } = useQuery({ queryKey: ['high-risk-patients'], queryFn: dashboardApi.highRisk, refetchInterval: 60000 })
  const { data: riskSummary } = useQuery({ queryKey: ['risk-summary'], queryFn: riskApi.summary })

  const riskPieData = summary ? [
    { name: 'High Risk',   value: summary.high_risk_count },
    { name: 'Medium Risk', value: summary.medium_risk_count },
    { name: 'Low Risk',    value: summary.low_risk_count },
  ] : []

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <PageHeader title="Analytics" subtitle="Population-level health insights and trend analysis" />

      {/* Row 1: pie + trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-1">Risk Distribution</h3>
          <p className="text-xs text-slate-600 mb-4">{summary?.total_patients ?? 0} patients total</p>
          {riskPieData.length ? <RiskPieChart data={riskPieData} /> : <div className="flex justify-center py-8"><Spinner /></div>}
          <div className="space-y-2 mt-4">
            {[
              { label: 'High Risk',   count: summary?.high_risk_count,   color: 'bg-coral-500' },
              { label: 'Medium Risk', count: summary?.medium_risk_count, color: 'bg-amber-400' },
              { label: 'Low Risk',    count: summary?.low_risk_count,    color: 'bg-jade-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-slate-400 flex-1">{label}</span>
                <span className="text-sm font-mono text-slate-200">{count ?? 0}</span>
                <span className="text-xs text-slate-600">
                  {summary ? ((((count ?? 0) / summary.total_patients) * 100).toFixed(0)) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-1">Alert Frequency</h3>
          <p className="text-xs text-slate-600 mb-4">Last 7 days</p>
          {trends ? <TrendsChart data={trends} /> : <div className="flex justify-center py-8"><Spinner /></div>}
        </div>
      </div>

      {/* High-risk patients detail */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-300">High-Risk Patients</h3>
            <p className="text-xs text-slate-600 mt-0.5">Patients requiring immediate attention</p>
          </div>
          <span className="text-xs bg-coral-500/10 text-coral-400 border border-coral-500/20 px-2 py-1 rounded-full">
            {highRisk?.length ?? 0} patients
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-navy-900">
                <th className="table-header text-left">Patient</th>
                <th className="table-header text-left">Village</th>
                <th className="table-header text-center">Week</th>
                <th className="table-header text-center">Risk Score</th>
                <th className="table-header text-left">Top Risk Factors</th>
                <th className="table-header text-center">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(highRisk ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-navy-800/40">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-coral-500/15 flex items-center justify-center">
                        <span className="text-xs text-coral-400 font-medium">{p.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-500">Age {p.age}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-400">{p.village}</td>
                  <td className="table-cell text-center font-mono text-slate-300">{p.pregnancy_week}</td>
                  <td className="table-cell text-center">
                    <span className="text-coral-400 font-mono font-medium">{p.risk_score}</span>
                  </td>
                  <td className="table-cell">
                    <ul className="space-y-0.5">
                      {(p.reasons ?? []).slice(0, 2).map((r: string, i: number) => (
                        <li key={i} className="text-xs text-slate-500 truncate max-w-xs">› {r}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="table-cell text-center"><RiskBadge level="high" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
