export type Role = 'asha' | 'doctor' | 'admin'
export type RiskLevel = 'low' | 'medium' | 'high'
export type AlertStatus = 'new' | 'acknowledged' | 'resolved'
export type AlertSeverity = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  assigned_villages: string[]
}

export interface Patient {
  id: string
  name: string
  age: number
  village: string
  district: string
  phone: string
  pregnancy_week: number
  expected_due_date: string
  medical_conditions: string[]
  emergency_contact: string
  assigned_asha_worker_id?: string
  assigned_doctor_id?: string
  device_id?: string
  risk_level?: RiskLevel
  last_vitals_update?: string
  created_at: string
}

export interface Vital {
  id: string
  patient_id: string
  heart_rate: number
  systolic_bp: number
  diastolic_bp: number
  temperature: number
  oxygen_level: number
  activity_level: number
  blood_sugar?: number
  timestamp: string
  source: string
}

export interface RiskAssessment {
  id: string
  patient_id: string
  risk_score: number
  risk_level: RiskLevel
  reasons: string[]
  suggested_action: string
  computed_at: string
}

export interface Alert {
  id: string
  patient_id: string
  patient_name?: string
  alert_type: string
  severity: AlertSeverity
  message: string
  suggested_action: string
  status: AlertStatus
  created_at: string
  acknowledged_by?: string
  resolved_at?: string
}

export interface Visit {
  id: string
  patient_id: string
  asha_worker_id: string
  visit_date: string
  notes: string
  vitals_recorded: boolean
  medicine_provided?: string
  follow_up_date?: string
}

export interface Device {
  id: string
  device_id: string
  patient_id?: string
  patient_name?: string
  battery_status: number
  connection_status: string
  last_sync: string
  firmware_version?: string
}

export interface DashboardSummary {
  total_patients: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  alerts_today: number
  upcoming_checkups: number
  total_villages: number
}

export interface VillageRisk {
  village: string
  district: string
  total_patients: number
  high_risk_count: number
  medium_risk_count: number
  avg_risk_score: number
  latest_alert_count: number
}

export interface WsVitalsUpdate {
  type: 'vitals_update'
  patient_id: string
  patient_name: string
  vitals: Omit<Vital, 'id' | 'patient_id' | 'timestamp' | 'source'>
  risk_level: RiskLevel
  risk_score: number
  timestamp: string
}

export interface LivePatientRow extends Patient {
  latest_vital?: Vital
  risk_score?: number
}
