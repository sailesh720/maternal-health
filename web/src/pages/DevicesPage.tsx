import { useQuery } from '@tanstack/react-query'
import { Cpu, Battery, Wifi, WifiOff } from 'lucide-react'
import { devicesApi } from '../services/api'
import { PageHeader, Spinner, EmptyState } from '../components/ui'
import type { Device } from '../types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? 'bg-jade-400' : level > 20 ? 'bg-amber-400' : 'bg-coral-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-navy-900 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400">{level}%</span>
    </div>
  )
}

export function DevicesPage() {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.list,
    refetchInterval: 30000,
  })

  const connected = (devices ?? []).filter((d: Device) => d.connection_status === 'connected').length
  const disconnected = (devices ?? []).filter((d: Device) => d.connection_status !== 'connected').length
  const lowBattery = (devices ?? []).filter((d: Device) => d.battery_status < 20).length

  return (
    <div className="p-6 space-y-5 animate-fade-up">
      <PageHeader title="Device Monitor" subtitle="Wearable device status and connectivity" />

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="card px-4 py-2.5 flex items-center gap-2">
          <Cpu size={14} className="text-slate-500" />
          <span className="text-sm text-slate-300">{devices?.length ?? 0} total devices</span>
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-2">
          <Wifi size={14} className="text-jade-400" />
          <span className="text-sm text-jade-400">{connected} connected</span>
        </div>
        {disconnected > 0 && (
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <WifiOff size={14} className="text-coral-400" />
            <span className="text-sm text-coral-400">{disconnected} offline</span>
          </div>
        )}
        {lowBattery > 0 && (
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <Battery size={14} className="text-amber-400" />
            <span className="text-sm text-amber-400">{lowBattery} low battery</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (devices ?? []).length === 0 ? (
        <EmptyState message="No devices registered" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-navy-900">
                <th className="table-header text-left">Device ID</th>
                <th className="table-header text-left">Assigned To</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-left">Battery</th>
                <th className="table-header text-right">Last Sync</th>
                <th className="table-header text-left">Firmware</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(devices as Device[]).map((d) => (
                <tr key={d.id} className="hover:bg-navy-800/40">
                  <td className="table-cell">
                    <span className="font-mono text-slate-200 text-sm">{d.device_id}</span>
                  </td>
                  <td className="table-cell">
                    {d.patient_name ? (
                      <span className="text-slate-300">{d.patient_name}</span>
                    ) : (
                      <span className="text-slate-600 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      d.connection_status === 'connected'
                        ? 'bg-jade-500/10 text-jade-400 border border-jade-500/20'
                        : 'bg-slate-800 text-slate-500 border border-white/5'
                    )}>
                      {d.connection_status === 'connected' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-jade-400 live-dot" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                      {d.connection_status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <BatteryBar level={d.battery_status} />
                  </td>
                  <td className="table-cell text-right text-xs text-slate-500">
                    {formatDistanceToNow(new Date(d.last_sync), { addSuffix: true })}
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-mono text-slate-600">{d.firmware_version}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
