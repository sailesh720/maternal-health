"""Patient CRUD and related data routes"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from app.database import get_db
from app.models.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.utils.auth import get_current_user

router = APIRouter()


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_patients(
    village: str = Query(None),
    risk_level: str = Query(None),
    assigned_to_me: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query = {}
    if village:
        query["village"] = village
    if risk_level:
        query["risk_level"] = risk_level
    if assigned_to_me and current_user["role"] == "asha":
        query["assigned_asha_worker_id"] = str(current_user["_id"])

    patients = await db.patients.find(query).sort("name", 1).to_list(200)
    return [_serialize(p) for p in patients]


@router.post("", status_code=201)
async def create_patient(
    body: PatientCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    doc = body.dict()
    doc["created_at"] = datetime.utcnow()
    doc["risk_level"] = None
    doc["last_vitals_update"] = None

    # Auto-assign ASHA worker if they're registering
    if current_user["role"] == "asha" and not doc.get("assigned_asha_worker_id"):
        doc["assigned_asha_worker_id"] = str(current_user["_id"])

    result = await db.patients.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _serialize(patient)


@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.patients.find_one_and_update(
        {"_id": ObjectId(patient_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _serialize(result)


@router.get("/{patient_id}/vitals")
async def get_patient_vitals(
    patient_id: str,
    limit: int = Query(20),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    vitals = await db.vitals.find(
        {"patient_id": patient_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return [_serialize(v) for v in vitals]


@router.get("/{patient_id}/risk")
async def get_patient_risk(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    risk = await db.risk_assessments.find_one(
        {"patient_id": patient_id},
        sort=[("computed_at", -1)]
    )
    if not risk:
        raise HTTPException(status_code=404, detail="No risk assessment found")
    return _serialize(risk)


@router.get("/{patient_id}/alerts")
async def get_patient_alerts(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    alerts = await db.alerts.find(
        {"patient_id": patient_id}
    ).sort("created_at", -1).to_list(50)
    return [_serialize(a) for a in alerts]


@router.get("/{patient_id}/visits")
async def get_patient_visits(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    visits = await db.visits.find(
        {"patient_id": patient_id}
    ).sort("visit_date", -1).to_list(50)
    return [_serialize(v) for v in visits]
