import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  requestOtp: (phone: string) =>
    api.post('/auth/request-otp', { phone }).then((r) => r.data),
}

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  villageRisk: () => api.get('/dashboard/village-risk').then((r) => r.data),
  highRisk: () => api.get('/dashboard/high-risk-patients').then((r) => r.data),
  trends: () => api.get('/dashboard/trends').then((r) => r.data),
}

// ── Patients ──────────────────────────────────────
export const patientsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/patients', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/patients/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/patients', data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.put(`/patients/${id}`, data).then((r) => r.data),
  vitals: (id: string, limit = 20) =>
    api.get(`/patients/${id}/vitals`, { params: { limit } }).then((r) => r.data),
  risk: (id: string) => api.get(`/patients/${id}/risk`).then((r) => r.data),
  alerts: (id: string) => api.get(`/patients/${id}/alerts`).then((r) => r.data),
  visits: (id: string) => api.get(`/patients/${id}/visits`).then((r) => r.data),
}

// ── Vitals ────────────────────────────────────────
export const vitalsApi = {
  live: () => api.get('/vitals/live').then((r) => r.data),
  forPatient: (id: string, limit = 50) =>
    api.get(`/vitals/patient/${id}`, { params: { limit } }).then((r) => r.data),
}

// ── Alerts ────────────────────────────────────────
export const alertsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/alerts', { params }).then((r) => r.data),
  acknowledge: (id: string) =>
    api.post(`/alerts/${id}/acknowledge`).then((r) => r.data),
  resolve: (id: string) =>
    api.post(`/alerts/${id}/resolve`).then((r) => r.data),
}

// ── Visits ────────────────────────────────────────
export const visitsApi = {
  create: (data: unknown) => api.post('/visits', data).then((r) => r.data),
  list: () => api.get('/visits').then((r) => r.data),
}

// ── Devices ───────────────────────────────────────
export const devicesApi = {
  list: () => api.get('/devices').then((r) => r.data),
}

// ── Simulation ────────────────────────────────────
export const simulationApi = {
  start: () => api.post('/simulation/start').then((r) => r.data),
  stop: () => api.post('/simulation/stop').then((r) => r.data),
  status: () => api.get('/simulation/status').then((r) => r.data),
}

// ── Risk ──────────────────────────────────────────
export const riskApi = {
  evaluate: (patientId: string) =>
    api.post(`/risk/evaluate/${patientId}`).then((r) => r.data),
  summary: () => api.get('/risk/summary').then((r) => r.data),
}

// ── Dataset ───────────────────────────────────────
export const datasetApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/dataset/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  runRiskEngine: () => api.post('/dataset/run-risk-engine').then((r) => r.data),
}
