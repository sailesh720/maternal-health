"""
Pydantic models for request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class Role(str, Enum):
    ASHA = "asha"
    DOCTOR = "doctor"
    ADMIN = "admin"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertStatus(str, Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


# ── Auth ──────────────────────────────────────────
class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str


class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str


# ── User ──────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: Role
    password: str
    assigned_region: Optional[str] = None
    assigned_villages: Optional[List[str]] = []


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    assigned_region: Optional[str] = None
    assigned_villages: Optional[List[str]] = []
    created_at: datetime


# ── Patient ───────────────────────────────────────
class PatientCreate(BaseModel):
    name: str
    age: int
    village: str
    district: str
    phone: str
    pregnancy_week: int
    expected_due_date: str
    medical_conditions: Optional[List[str]] = []
    emergency_contact: str
    assigned_asha_worker_id: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    device_id: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    village: Optional[str] = None
    phone: Optional[str] = None
    pregnancy_week: Optional[int] = None
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    device_id: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    village: str
    district: str
    phone: str
    pregnancy_week: int
    expected_due_date: str
    medical_conditions: List[str]
    emergency_contact: str
    assigned_asha_worker_id: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    device_id: Optional[str] = None
    risk_level: Optional[str] = None
    last_vitals_update: Optional[datetime] = None
    created_at: datetime


# ── Vitals ────────────────────────────────────────
class VitalCreate(BaseModel):
    patient_id: str
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    temperature: float
    oxygen_level: float
    activity_level: float  # 0–100 steps/activity score
    blood_sugar: Optional[float] = None
    source: str = "manual"


class VitalResponse(BaseModel):
    id: str
    patient_id: str
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    temperature: float
    oxygen_level: float
    activity_level: float
    blood_sugar: Optional[float] = None
    timestamp: datetime
    source: str


# ── Risk ──────────────────────────────────────────
class RiskAssessmentResponse(BaseModel):
    id: str
    patient_id: str
    risk_score: float
    risk_level: str
    reasons: List[str]
    suggested_action: str
    computed_at: datetime


# ── Alerts ────────────────────────────────────────
class AlertResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    suggested_action: str
    status: str
    created_at: datetime
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None


# ── Visits ────────────────────────────────────────
class VisitCreate(BaseModel):
    patient_id: str
    visit_date: str
    notes: str
    vitals_recorded: Optional[bool] = True
    medicine_provided: Optional[str] = None
    follow_up_date: Optional[str] = None


class VisitResponse(BaseModel):
    id: str
    patient_id: str
    asha_worker_id: str
    visit_date: str
    notes: str
    vitals_recorded: bool
    medicine_provided: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: datetime


# ── Device ────────────────────────────────────────
class DeviceResponse(BaseModel):
    id: str
    device_id: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    battery_status: int
    connection_status: str
    last_sync: datetime
    firmware_version: Optional[str] = "1.0.0"


# ── Dashboard ─────────────────────────────────────
class DashboardSummary(BaseModel):
    total_patients: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    alerts_today: int
    upcoming_checkups: int
    total_villages: int


class VillageRiskSummary(BaseModel):
    village: str
    district: str
    total_patients: int
    high_risk_count: int
    medium_risk_count: int
    avg_risk_score: float
    latest_alert_count: int
