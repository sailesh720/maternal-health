import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      setToken(stored)
      authApi.me()
        .then(setUser)
        .catch(() => { localStorage.clear(); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const me = await authApi.me()
    setUser(me)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
