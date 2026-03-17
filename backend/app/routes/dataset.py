"""Dataset upload and demo data management"""
import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.database import get_db
from app.utils.auth import get_current_user
from app.services.risk_engine import risk_engine, VitalInput

router = APIRouter()


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload CSV with patient data"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported")

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    db = get_db()
    count = 0

    for row in reader:
        try:
            patient_doc = {
                "name": row.get("name", ""),
                "age": int(row.get("age", 25)),
                "village": row.get("village", ""),
                "district": row.get("district", ""),
                "phone": row.get("phone", ""),
                "pregnancy_week": int(row.get("pregnancy_week", 20)),
                "expected_due_date": row.get("expected_due_date", ""),
                "medical_conditions": row.get("medical_conditions", "").split(";") if row.get("medical_conditions") else [],
                "emergency_contact": row.get("emergency_contact", ""),
                "created_at": datetime.utcnow(),
                "risk_level": None,
            }
            await db.patients.insert_one(patient_doc)
            count += 1
        except Exception as e:
            continue

    return {"message": f"Uploaded {count} patients", "total": count}


@router.post("/run-risk-engine")
async def run_risk_engine_on_all(current_user: dict = Depends(get_current_user)):
    """Run risk assessment on all patients with latest vitals"""
    db = get_db()
    patients = await db.patients.find({}).to_list(200)
    processed = 0

    for patient in patients:
        pid = str(patient["_id"])
        vital = await db.vitals.find_one({"patient_id": pid}, sort=[("timestamp", -1)])
        if not vital:
            continue

        vi = VitalInput(
            patient_id=pid,
            age=patient.get("age", 25),
            pregnancy_week=patient.get("pregnancy_week", 20),
            systolic_bp=vital.get("systolic_bp", 120),
            diastolic_bp=vital.get("diastolic_bp", 80),
            heart_rate=vital.get("heart_rate", 80),
            body_temperature=vital.get("temperature", 37.0),
            oxygen_level=vital.get("oxygen_level", 98),
            activity_level=vital.get("activity_level", 50),
            blood_sugar=vital.get("blood_sugar"),
            known_conditions=patient.get("medical_conditions", []),
        )
        result = risk_engine.evaluate(vi)
        await db.risk_assessments.replace_one(
            {"patient_id": pid},
            {
                "patient_id": pid,
                "risk_score": result.risk_score,
                "risk_level": result.risk_level,
                "reasons": result.reasons,
                "suggested_action": result.suggested_action,
                "computed_at": datetime.utcnow(),
            },
            upsert=True,
        )
        await db.patients.update_one(
            {"_id": patient["_id"]},
            {"$set": {"risk_level": result.risk_level}}
        )
        processed += 1

    return {"message": f"Risk engine run on {processed} patients"}
