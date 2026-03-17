import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@health.gov.in')
  const [password, setPassword] = useState('admin1234')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const DEMO_ACCOUNTS = [
    { label: 'Admin',   email: 'admin@health.gov.in',  password: 'admin1234' },
    { label: 'Doctor',  email: 'anil@hospital.gov.in', password: 'demo1234'  },
    { label: 'ASHA',    email: 'priya@asha.gov.in',    password: 'demo1234'  },
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coral-500/15 border border-coral-500/20 mb-4 shadow-glow-coral">
            <Heart size={24} className="text-coral-400" fill="rgba(255,95,61,0.4)" />
          </div>
          <h1 className="font-display text-3xl font-light text-white">MaternaCare</h1>
          <p className="text-slate-500 text-sm mt-1">Maternal Health Monitoring System</p>
        </div>

        {/* Card */}
        <div className="card-glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : null}
              Sign In
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 text-center">Demo accounts</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setEmail(a.email); setPassword(a.password) }}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-white/5 text-slate-400 hover:text-slate-200 transition-all"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
