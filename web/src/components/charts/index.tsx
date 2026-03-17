import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = {
  coral:  '#ff5f3d',
  jade:   '#1bbf84',
  amber:  '#ffb547',
  blue:   '#60a5fa',
  grid:   'rgba(255,255,255,0.05)',
  axis:   '#475569',
}

const customTooltipStyle = {
  backgroundColor: '#131f3c',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: '12px',
}

interface TrendData {
  date: string
  total_alerts: number
  high_severity: number
}

export function TrendsChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="date" tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={customTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        <Line type="monotone" dataKey="total_alerts" name="Total Alerts" stroke={COLORS.amber} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="high_severity" name="High Severity" stroke={COLORS.coral} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface RiskPieData {
  name: string
  value: number
}

const RISK_COLORS = [COLORS.coral, COLORS.amber, COLORS.jade]

export function RiskPieChart({ data }: { data: RiskPieData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip contentStyle={customTooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface VillageBarData {
  village: string
  high_risk_count: number
  medium_risk_count: number
  total_patients: number
}

export function VillageBarChart({ data }: { data: VillageBarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="village" tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={customTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        <Bar dataKey="high_risk_count" name="High Risk" fill={COLORS.coral} radius={[3, 3, 0, 0]} />
        <Bar dataKey="medium_risk_count" name="Medium Risk" fill={COLORS.amber} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Sparkline({ data, color = COLORS.coral }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
