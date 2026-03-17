import { useQuery } from '@tanstack/react-query'
import { MapPin, TrendingUp } from 'lucide-react'
import { dashboardApi } from '../services/api'
import { PageHeader, Spinner } from '../components/ui'
import { VillageBarChart } from '../components/charts'
import type { VillageRisk } from '../types'
import clsx from 'clsx'

function riskColor(score: number) {
  if (score >= 6) return 'from-coral-500/20 to-coral-500/5 border-coral-500/30'
  if (score >= 3) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30'
  return 'from-jade-500/20 to-jade-500/5 border-jade-500/30'
}

function riskTextColor(score: number) {
  if (score >= 6) return 'text-coral-400'
  if (score >= 3) return 'text-amber-400'
  return 'text-jade-400'
}

function RiskMeter({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100)
  return (
    <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
      <div
        className={clsx(
          'h-full rounded-full transition-all',
          score >= 6 ? 'bg-coral-500' : score >= 3 ? 'bg-amber-400' : 'bg-jade-400'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function VillagesPage() {
  const { data: villageRisk, isLoading } = useQuery({
    queryKey: ['village-risk'],
    queryFn: dashboardApi.villageRisk,
    refetchInterval: 60000,
  })

  const sorted = (villageRisk ?? []) as VillageRisk[]

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <PageHeader
        title="Village Risk Map"
        subtitle="Health status summary by village and district"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (
        <>
          {/* Heat cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((v) => (
              <div
                key={v.village}
                className={clsx(
                  'rounded-xl border bg-gradient-to-br p-5 relative overflow-hidden',
                  riskColor(v.avg_risk_score)
                )}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/3 -translate-y-8 translate-x-8" />

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">{v.village}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {v.district}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={clsx('text-2xl font-display font-light', riskTextColor(v.avg_risk_score))}>
                      {v.avg_risk_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-600">avg score</p>
                  </div>
                </div>

                <RiskMeter score={v.avg_risk_score} />

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-display text-white">{v.total_patients}</p>
                    <p className="text-xs text-slate-500">mothers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-display text-coral-400">{v.high_risk_count}</p>
                    <p className="text-xs text-slate-500">high risk</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-display text-amber-400">{v.latest_alert_count}</p>
                    <p className="text-xs text-slate-500">alerts today</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart comparison */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-slate-500" />
              <h3 className="text-sm font-medium text-slate-300">Village Risk Comparison</h3>
            </div>
            <VillageBarChart data={sorted} />
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-navy-900">
                  <th className="table-header text-left">Village</th>
                  <th className="table-header text-left">District</th>
                  <th className="table-header text-center">Total</th>
                  <th className="table-header text-center">High Risk</th>
                  <th className="table-header text-center">Medium Risk</th>
                  <th className="table-header text-center">Alerts Today</th>
                  <th className="table-header text-center">Avg Score</th>
                  <th className="table-header text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((v) => (
                  <tr key={v.village} className="hover:bg-navy-800/40">
                    <td className="table-cell font-medium text-slate-200">{v.village}</td>
                    <td className="table-cell text-slate-400">{v.district}</td>
                    <td className="table-cell text-center font-mono">{v.total_patients}</td>
                    <td className="table-cell text-center">
                      <span className={clsx('font-mono', v.high_risk_count > 0 ? 'text-coral-400' : 'text-slate-500')}>
                        {v.high_risk_count}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={clsx('font-mono', v.medium_risk_count > 0 ? 'text-amber-400' : 'text-slate-500')}>
                        {v.medium_risk_count}
                      </span>
                    </td>
                    <td className="table-cell text-center font-mono text-slate-400">{v.latest_alert_count}</td>
                    <td className="table-cell text-center">
                      <span className={clsx('font-mono font-medium', riskTextColor(v.avg_risk_score))}>
                        {v.avg_risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="w-24">
                        <RiskMeter score={v.avg_risk_score} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
