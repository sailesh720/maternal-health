import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
console.log('API BASE_URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach auth token from SecureStore
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  loginByPhone: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  requestOtp: (phone: string) =>
    api.post('/auth/request-otp', { phone }).then((r) => r.data),
  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', { phone, otp }).then((r) => r.data),
};

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  highRisk: () => api.get('/dashboard/high-risk-patients').then((r) => r.data),
};

// ── Patients ──────────────────────────────────────
export const patientsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/patients', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/patients/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/patients', data).then((r) => r.data),
  vitals: (id: string, limit = 10) =>
    api.get(`/patients/${id}/vitals`, { params: { limit } }).then((r) => r.data),
  risk: (id: string) => api.get(`/patients/${id}/risk`).then((r) => r.data),
  alerts: (id: string) => api.get(`/patients/${id}/alerts`).then((r) => r.data),
  visits: (id: string) => api.get(`/patients/${id}/visits`).then((r) => r.data),
};

// ── Alerts ────────────────────────────────────────
export const alertsApi = {
  list: (params?: Record<string, string>) =>
    api.get('/alerts', { params }).then((r) => r.data),
  acknowledge: (id: string) => api.post(`/alerts/${id}/acknowledge`).then((r) => r.data),
  resolve: (id: string) => api.post(`/alerts/${id}/resolve`).then((r) => r.data),
};

// ── Visits ────────────────────────────────────────
export const visitsApi = {
  create: (data: unknown) => api.post('/visits', data).then((r) => r.data),
  list: () => api.get('/visits').then((r) => r.data),
};

// ── Risk ──────────────────────────────────────────
export const riskApi = {
  evaluate: (patientId: string) =>
    api.post(`/risk/evaluate/${patientId}`).then((r) => r.data),
};
