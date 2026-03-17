"""
Simulated wearable (Apple Watch-like) vital data generator.
Runs as a background asyncio task, updating vitals every 20–30 seconds.
"""
import asyncio
import random
import logging
from datetime import datetime
from typing import Optional, Set
from bson import ObjectId

from app.database import get_db
from app.services.risk_engine import risk_engine, VitalInput

logger = logging.getLogger(__name__)


class PatientProfile:
    """Defines simulation behavior for a patient"""
    STABLE = "stable"
    MEDIUM_RISK = "medium_risk"
    HIGH_RISK = "high_risk"
    VARIABLE = "variable"


def _normal_vitals() -> dict:
    return {
        "heart_rate": random.uniform(72, 88),
        "systolic_bp": random.uniform(105, 125),
        "diastolic_bp": random.uniform(65, 80),
        "temperature": random.uniform(36.5, 37.2),
        "oxygen_level": random.uniform(97, 99),
        "activity_level": random.uniform(30, 70),
        "blood_sugar": random.uniform(85, 115),
    }


def _medium_risk_vitals() -> dict:
    return {
        "heart_rate": random.uniform(95, 112),
        "systolic_bp": random.uniform(130, 148),
        "diastolic_bp": random.uniform(82, 94),
        "temperature": random.uniform(37.2, 38.1),
        "oxygen_level": random.uniform(94, 97),
        "activity_level": random.uniform(15, 45),
        "blood_sugar": random.uniform(115, 150),
    }


def _high_risk_vitals() -> dict:
    return {
        "heart_rate": random.uniform(112, 130),
        "systolic_bp": random.uniform(148, 170),
        "diastolic_bp": random.uniform(94, 112),
        "temperature": random.uniform(37.8, 39.2),
        "oxygen_level": random.uniform(90, 95),
        "activity_level": random.uniform(0, 20),
        "blood_sugar": random.uniform(150, 200),
    }


def _generate_vitals_for_profile(profile: str) -> dict:
    """Generate vitals with some noise based on patient profile"""
    if profile == PatientProfile.STABLE:
        base = _normal_vitals()
    elif profile == PatientProfile.MEDIUM_RISK:
        # Occasionally drift to high risk
        if random.random() < 0.15:
            base = _high_risk_vitals()
        else:
            base = _medium_risk_vitals()
    elif profile == PatientProfile.HIGH_RISK:
        # Mostly high risk, occasionally medium
        if random.random() < 0.1:
            base = _medium_risk_vitals()
        else:
            base = _high_risk_vitals()
    else:  # VARIABLE
        choice = random.choices(
            [_normal_vitals, _medium_risk_vitals, _high_risk_vitals],
            weights=[60, 30, 10]
        )[0]
        base = choice()

    # Add small random noise
    base["heart_rate"] += random.uniform(-2, 2)
    base["systolic_bp"] += random.uniform(-3, 3)
    base["diastolic_bp"] += random.uniform(-2, 2)
    return {k: round(v, 1) for k, v in base.items()}


class VitalSimulator:
    """Background service that simulates wearable vital updates"""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._patient_profiles: dict = {}  # patient_id -> profile
        self.websocket_broadcaster = None  # Injected by websocket module

    def set_broadcaster(self, broadcaster):
        self.websocket_broadcaster = broadcaster

    def start(self):
        if self._running:
            logger.info("Simulator already running")
            return
        self._running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info("Vital simulator started")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Vital simulator stopped")

    def is_running(self) -> bool:
        return self._running

    async def _simulation_loop(self):
        """Main loop: update vitals for all active patients every 20–30 seconds"""
        while self._running:
            try:
                db = get_db()
                patients = await db.patients.find({}).to_list(100)

                for patient in patients:
                    patient_id = str(patient["_id"])
                    profile = self._patient_profiles.get(
                        patient_id, PatientProfile.VARIABLE
                    )
                    await self._update_patient_vitals(patient, profile)

                interval = random.uniform(20, 30)
                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulator error: {e}")
                await asyncio.sleep(5)

    async def _update_patient_vitals(self, patient: dict, profile: str):
        """Generate and save vitals, run risk engine, create alerts"""
        db = get_db()
        patient_id = str(patient["_id"])

        vitals_data = _generate_vitals_for_profile(profile)
        vitals_doc = {
            "patient_id": patient_id,
            **vitals_data,
            "timestamp": datetime.utcnow(),
            "source": "simulated",
        }

        # Save vitals
        result = await db.vitals.insert_one(vitals_doc)
        vitals_doc["_id"] = result.inserted_id

        # Update device last_sync
        if patient.get("device_id"):
            await db.devices.update_one(
                {"device_id": patient["device_id"]},
                {"$set": {
                    "last_sync": datetime.utcnow(),
                    "connection_status": "connected",
                    "battery_status": random.randint(20, 100),
                }}
            )

        # Run risk engine
        from datetime import timedelta
        last_visit = await db.visits.find_one(
            {"patient_id": patient_id},
            sort=[("visit_date", -1)]
        )
        days_since = 0
        if last_visit and last_visit.get("visit_date"):
            try:
                lv_date = datetime.strptime(str(last_visit["visit_date"]), "%Y-%m-%d")
                days_since = (datetime.utcnow() - lv_date).days
            except Exception:
                pass

        vital_input = VitalInput(
            patient_id=patient_id,
            age=patient.get("age", 25),
            pregnancy_week=patient.get("pregnancy_week", 20),
            systolic_bp=vitals_data["systolic_bp"],
            diastolic_bp=vitals_data["diastolic_bp"],
            heart_rate=vitals_data["heart_rate"],
            body_temperature=vitals_data["temperature"],
            oxygen_level=vitals_data["oxygen_level"],
            activity_level=vitals_data["activity_level"],
            blood_sugar=vitals_data.get("blood_sugar"),
            known_conditions=patient.get("medical_conditions", []),
            missed_checkup=days_since > 30,
            days_since_last_visit=days_since,
        )

        risk_result = risk_engine.evaluate(vital_input)

        # Save risk assessment
        risk_doc = {
            "patient_id": patient_id,
            "risk_score": risk_result.risk_score,
            "risk_level": risk_result.risk_level,
            "reasons": risk_result.reasons,
            "suggested_action": risk_result.suggested_action,
            "computed_at": datetime.utcnow(),
        }
        await db.risk_assessments.replace_one(
            {"patient_id": patient_id},
            risk_doc,
            upsert=True,
        )

        # Update patient risk cache
        await db.patients.update_one(
            {"_id": patient["_id"]},
            {"$set": {
                "risk_level": risk_result.risk_level,
                "last_vitals_update": datetime.utcnow(),
            }}
        )

        # Generate alerts
        for alert_data in risk_result.alerts_to_generate:
            # Don't duplicate active alerts of same type
            existing = await db.alerts.find_one({
                "patient_id": patient_id,
                "alert_type": alert_data["alert_type"],
                "status": {"$in": ["new", "acknowledged"]},
            })
            if not existing:
                alert_doc = {
                    "patient_id": patient_id,
                    **alert_data,
                    "status": "new",
                    "created_at": datetime.utcnow(),
                    "acknowledged_by": None,
                    "resolved_at": None,
                }
                await db.alerts.insert_one(alert_doc)

                # Simulate SMS for high severity
                if alert_data["severity"] == "high":
                    _simulate_sms(
                        patient.get("phone", ""),
                        patient.get("emergency_contact", ""),
                        alert_data["message"],
                    )

        # Broadcast via WebSocket
        if self.websocket_broadcaster:
            payload = {
                "type": "vitals_update",
                "patient_id": patient_id,
                "patient_name": patient.get("name"),
                "vitals": vitals_data,
                "risk_level": risk_result.risk_level,
                "risk_score": risk_result.risk_score,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self.websocket_broadcaster(payload)

    def assign_profile(self, patient_id: str, profile: str):
        self._patient_profiles[patient_id] = profile

    def auto_assign_profiles(self, patient_ids: list):
        """Auto-assign profiles when seeding demo data"""
        n = len(patient_ids)
        for i, pid in enumerate(patient_ids):
            if i < n * 0.5:
                self._patient_profiles[pid] = PatientProfile.STABLE
            elif i < n * 0.8:
                self._patient_profiles[pid] = PatientProfile.MEDIUM_RISK
            else:
                self._patient_profiles[pid] = PatientProfile.HIGH_RISK


def _simulate_sms(patient_phone: str, emergency_contact: str, message: str):
    """Simulate SMS notification — logs in production, replace with Twilio etc."""
    logger.warning(
        f"[SMS SIMULATION] TO: {patient_phone} / Emergency: {emergency_contact} | "
        f"ALERT: {message}"
    )
