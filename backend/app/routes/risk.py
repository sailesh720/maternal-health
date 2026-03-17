"""Risk engine routes"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database import get_db
from app.utils.auth import get_current_user
from app.services.risk_engine import risk_engine, VitalInput

router = APIRouter()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/evaluate/{patient_id}")
async def evaluate_patient_risk(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_vital = await db.vitals.find_one({"patient_id": patient_id}, sort=[("timestamp", -1)])
    if not latest_vital:
        raise HTTPException(status_code=404, detail="No vitals found for patient")

    vital_input = VitalInput(
        patient_id=patient_id,
        age=patient.get("age", 25),
        pregnancy_week=patient.get("pregnancy_week", 20),
        systolic_bp=latest_vital.get("systolic_bp", 120),
        diastolic_bp=latest_vital.get("diastolic_bp", 80),
        heart_rate=latest_vital.get("heart_rate", 80),
        body_temperature=latest_vital.get("temperature", 37.0),
        oxygen_level=latest_vital.get("oxygen_level", 98),
        activity_level=latest_vital.get("activity_level", 50),
        blood_sugar=latest_vital.get("blood_sugar"),
        known_conditions=patient.get("medical_conditions", []),
    )

    result = risk_engine.evaluate(vital_input)
    risk_doc = {
        "patient_id": patient_id,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "reasons": result.reasons,
        "suggested_action": result.suggested_action,
        "computed_at": datetime.utcnow(),
    }
    await db.risk_assessments.replace_one({"patient_id": patient_id}, risk_doc, upsert=True)
    await db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": {"risk_level": result.risk_level}})

    risk_doc["id"] = patient_id
    return risk_doc


@router.get("/patient/{patient_id}")
async def get_risk_for_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    risk = await db.risk_assessments.find_one({"patient_id": patient_id}, sort=[("computed_at", -1)])
    if not risk:
        raise HTTPException(status_code=404, detail="No risk assessment found")
    return _serialize(risk)


@router.get("/summary")
async def get_risk_summary(current_user: dict = Depends(get_current_user)):
    db = get_db()
    pipeline = [{"$group": {"_id": "$risk_level", "count": {"$sum": 1}}}]
    results = await db.risk_assessments.aggregate(pipeline).to_list(10)
    return {r["_id"]: r["count"] for r in results}
