"""
AI Risk Engine - Rule-based pregnancy risk scoring system
Modular and extensible for future ML integration.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class VitalInput:
    patient_id: str
    age: int
    pregnancy_week: int
    systolic_bp: float
    diastolic_bp: float
    heart_rate: float
    body_temperature: float
    oxygen_level: float
    activity_level: float  # 0–100
    blood_sugar: Optional[float] = None
    known_conditions: List[str] = field(default_factory=list)
    missed_checkup: bool = False
    days_since_last_visit: int = 0


@dataclass
class RiskResult:
    risk_score: float
    risk_level: str  # low / medium / high
    reasons: List[str]
    suggested_action: str
    alert_severity: str  # low / medium / high
    alerts_to_generate: List[Dict]


class RiskEngine:
    """
    Rule-based maternal health risk scoring engine.
    Score thresholds: 0-2 = Low, 3-5 = Medium, 6+ = High
    """

    HIGH_CONDITION_KEYWORDS = ["hypertension", "diabetes", "anaemia", "anemia",
                                "heart disease", "preeclampsia", "eclampsia",
                                "gestational diabetes", "hiv", "tuberculosis"]

    def evaluate(self, vital: VitalInput) -> RiskResult:
        score = 0.0
        reasons = []
        alerts = []

        # ── Blood Pressure ──────────────────────────────
        if vital.systolic_bp >= 160 or vital.diastolic_bp >= 110:
            score += 3
            reasons.append(f"Severe hypertension detected (BP: {vital.systolic_bp}/{vital.diastolic_bp} mmHg)")
            alerts.append(self._make_alert("high_blood_pressure", "high",
                f"Severe BP: {vital.systolic_bp}/{vital.diastolic_bp} mmHg",
                "Immediate medical attention required"))
        elif vital.systolic_bp >= 140 or vital.diastolic_bp >= 90:
            score += 2
            reasons.append(f"High blood pressure detected (BP: {vital.systolic_bp}/{vital.diastolic_bp} mmHg)")
            alerts.append(self._make_alert("high_blood_pressure", "medium",
                f"Elevated BP: {vital.systolic_bp}/{vital.diastolic_bp} mmHg",
                "Schedule doctor visit within 24 hours"))
        elif vital.systolic_bp >= 130 or vital.diastolic_bp >= 85:
            score += 1
            reasons.append(f"Borderline blood pressure (BP: {vital.systolic_bp}/{vital.diastolic_bp} mmHg)")

        # ── Heart Rate ───────────────────────────────────
        if vital.heart_rate > 120:
            score += 2
            reasons.append(f"Severe tachycardia (HR: {vital.heart_rate} bpm)")
            alerts.append(self._make_alert("abnormal_heart_rate", "high",
                f"Severe tachycardia: {vital.heart_rate} bpm",
                "Immediate medical evaluation needed"))
        elif vital.heart_rate > 110:
            score += 1.5
            reasons.append(f"Elevated heart rate (HR: {vital.heart_rate} bpm)")
            alerts.append(self._make_alert("abnormal_heart_rate", "medium",
                f"Elevated HR: {vital.heart_rate} bpm",
                "Monitor closely, consider doctor visit"))
        elif vital.heart_rate < 55:
            score += 1
            reasons.append(f"Low heart rate (HR: {vital.heart_rate} bpm)")

        # ── Temperature ──────────────────────────────────
        if vital.body_temperature >= 39:
            score += 2
            reasons.append(f"High fever detected ({vital.body_temperature}°C)")
            alerts.append(self._make_alert("temperature_spike", "high",
                f"High fever: {vital.body_temperature}°C",
                "Seek immediate medical care"))
        elif vital.body_temperature >= 38:
            score += 1
            reasons.append(f"Low-grade fever ({vital.body_temperature}°C)")
            alerts.append(self._make_alert("temperature_spike", "medium",
                f"Fever: {vital.body_temperature}°C",
                "Monitor temperature, hydrate, consider clinic visit"))

        # ── Oxygen Level ────────────────────────────────
        if vital.oxygen_level < 90:
            score += 3
            reasons.append(f"Critical oxygen level ({vital.oxygen_level}%)")
            alerts.append(self._make_alert("low_oxygen", "high",
                f"Critical SpO2: {vital.oxygen_level}%",
                "Emergency — immediate oxygen therapy required"))
        elif vital.oxygen_level < 94:
            score += 2
            reasons.append(f"Low oxygen saturation ({vital.oxygen_level}%)")
            alerts.append(self._make_alert("low_oxygen", "medium",
                f"Low SpO2: {vital.oxygen_level}%",
                "Medical evaluation required"))
        elif vital.oxygen_level < 96:
            score += 0.5
            reasons.append(f"Slightly reduced oxygen ({vital.oxygen_level}%)")

        # ── Activity Level ───────────────────────────────
        if vital.activity_level < 5:
            score += 1.5
            reasons.append("Very low activity — possible immobility risk")
            alerts.append(self._make_alert("no_activity_detected", "medium",
                "Patient shows no activity",
                "Check on patient welfare; may need home visit"))
        elif vital.activity_level < 20:
            score += 0.5
            reasons.append("Low activity level recorded")

        # ── Blood Sugar ──────────────────────────────────
        if vital.blood_sugar is not None:
            if vital.blood_sugar > 180:
                score += 2
                reasons.append(f"High blood sugar ({vital.blood_sugar} mg/dL)")
            elif vital.blood_sugar > 140:
                score += 1
                reasons.append(f"Elevated blood sugar ({vital.blood_sugar} mg/dL)")
            elif vital.blood_sugar < 70:
                score += 1.5
                reasons.append(f"Low blood sugar ({vital.blood_sugar} mg/dL)")

        # ── Age Risk Factors ────────────────────────────
        if vital.age < 18:
            score += 1.5
            reasons.append(f"Very young maternal age ({vital.age} years)")
        elif vital.age < 20:
            score += 1
            reasons.append(f"Adolescent pregnancy (age {vital.age})")
        elif vital.age > 40:
            score += 1.5
            reasons.append(f"Advanced maternal age ({vital.age} years)")
        elif vital.age > 35:
            score += 1
            reasons.append(f"Elevated maternal age ({vital.age} years)")

        # ── Pregnancy Week Context ───────────────────────
        if vital.pregnancy_week >= 37 and vital.pregnancy_week <= 42:
            score += 0.5
            reasons.append(f"Full-term pregnancy (week {vital.pregnancy_week}) — close monitoring needed")
        elif vital.pregnancy_week > 42:
            score += 1.5
            reasons.append(f"Post-term pregnancy (week {vital.pregnancy_week})")
        elif vital.pregnancy_week < 28:
            score += 0.5
            reasons.append(f"Second trimester (week {vital.pregnancy_week})")

        # ── Known Medical Conditions ─────────────────────
        known_lower = [c.lower() for c in vital.known_conditions]
        matched_conditions = []
        for condition in self.HIGH_CONDITION_KEYWORDS:
            if any(condition in k for k in known_lower):
                matched_conditions.append(condition)

        if len(matched_conditions) >= 2:
            score += 2
            reasons.append(f"Multiple high-risk conditions: {', '.join(matched_conditions)}")
        elif len(matched_conditions) == 1:
            score += 1
            reasons.append(f"Known condition: {matched_conditions[0]}")

        # ── Missed Checkup ───────────────────────────────
        if vital.missed_checkup or vital.days_since_last_visit > 30:
            score += 1
            reasons.append(f"Missed scheduled checkup ({vital.days_since_last_visit} days since last visit)")
            alerts.append(self._make_alert("missed_checkup", "low",
                f"Patient missed checkup — {vital.days_since_last_visit} days since last visit",
                "Schedule follow-up visit"))

        # ── Classify Risk ────────────────────────────────
        risk_level, alert_severity, suggested_action = self._classify(score, reasons)

        if not reasons:
            reasons.append("All vitals within normal range")

        return RiskResult(
            risk_score=round(score, 2),
            risk_level=risk_level,
            reasons=reasons,
            suggested_action=suggested_action,
            alert_severity=alert_severity,
            alerts_to_generate=alerts,
        )

    def _classify(self, score: float, reasons: list):
        if score >= 6:
            return "high", "high", "Immediate medical intervention required. Notify doctor and consider hospital admission."
        elif score >= 3:
            return "medium", "medium", "Schedule doctor visit within 24–48 hours. Increase monitoring frequency."
        else:
            return "low", "low", "Continue routine monitoring. Next checkup as scheduled."

    def _make_alert(self, alert_type: str, severity: str, message: str, action: str) -> dict:
        return {
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
            "suggested_action": action,
        }

    def detect_anomalies(self, vitals_list: list) -> List[dict]:
        """
        Detect anomalies across a time series of vitals.
        Useful for trend-based alerts.
        """
        anomalies = []
        if len(vitals_list) < 3:
            return anomalies

        # Check for persistent high BP trend
        high_bp_count = sum(
            1 for v in vitals_list[-5:]
            if v.get("systolic_bp", 0) >= 140 or v.get("diastolic_bp", 0) >= 90
        )
        if high_bp_count >= 3:
            anomalies.append({
                "type": "persistent_hypertension",
                "message": f"Blood pressure has been elevated in {high_bp_count} of last 5 readings",
                "severity": "high",
            })

        # Check for declining oxygen trend
        recent_oxygen = [v.get("oxygen_level", 100) for v in vitals_list[-3:]]
        if all(o < 96 for o in recent_oxygen) and recent_oxygen[-1] < recent_oxygen[0]:
            anomalies.append({
                "type": "declining_oxygen",
                "message": "Oxygen saturation showing declining trend",
                "severity": "medium",
            })

        return anomalies


# Singleton instance
risk_engine = RiskEngine()
