import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Bell, MapPin, Activity,
  BarChart3, Database, Cpu, LogOut, Heart, Radio
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useVitalsStream } from '../../hooks/useVitalsStream'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Overview'       },
  { to: '/monitoring',  icon: Activity,         label: 'Live Monitor'   },
  { to: '/patients',    icon: Users,            label: 'Patients'       },
  { to: '/alerts',      icon: Bell,             label: 'Alerts'         },
  { to: '/villages',    icon: MapPin,           label: 'Village Risk'   },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics'      },
  { to: '/devices',     icon: Cpu,              label: 'Devices'        },
  { to: '/dataset',     icon: Database,         label: 'Data Mgmt'      },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const { connected } = useVitalsStream()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-navy-900 border-r border-white/5 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-coral-500 flex items-center justify-center shadow-glow-coral">
              <Heart size={16} className="text-white" fill="white" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-white leading-none">MaternaCare</p>
              <p className="text-xs text-slate-500 mt-0.5">Health Dashboard</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full live-dot',
              connected ? 'bg-jade-400' : 'bg-slate-600'
            )} />
            <span className="text-xs text-slate-500">
              {connected ? 'Live monitoring active' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-coral-500/10 text-coral-400 border border-coral-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3">
            <div className="w-7 h-7 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-coral-400">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-slate-600 hover:text-coral-400 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-grid-pattern bg-grid">
        <Outlet />
      </main>
    </div>
  )
}
