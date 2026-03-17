import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { PatientsPage } from './pages/PatientsPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { NewPatientPage } from './pages/NewPatientPage'
import { AlertsPage } from './pages/AlertsPage'
import { VillagesPage } from './pages/VillagesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DevicesPage } from './pages/DevicesPage'
import { DatasetPage } from './pages/DatasetPage'
import { Spinner } from './components/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Spinner size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/patients"   element={<PatientsPage />} />
        <Route path="/patients/new" element={<NewPatientPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/alerts"     element={<AlertsPage />} />
        <Route path="/villages"   element={<VillagesPage />} />
        <Route path="/analytics"  element={<AnalyticsPage />} />
        <Route path="/devices"    element={<DevicesPage />} />
        <Route path="/dataset"    element={<DatasetPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#131f3c',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#1bbf84', secondary: '#131f3c' } },
              error: { iconTheme: { primary: '#ff5f3d', secondary: '#131f3c' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
