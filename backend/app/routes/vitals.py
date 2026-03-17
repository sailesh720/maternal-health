"""Vitals routes"""
from datetime import datetime
from fastapi import APIRouter, Depends
from app.database import get_db
from app.models.schemas import VitalCreate
from app.utils.auth import get_current_user
from app.services.risk_engine import risk_engine, VitalInput

router = APIRouter()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("")
async def create_vital(body: VitalCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = body.dict()
    doc["timestamp"] = datetime.utcnow()
    result = await db.vitals.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/patient/{patient_id}")
async def get_vitals_for_patient(patient_id: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    db = get_db()
    vitals = await db.vitals.find({"patient_id": patient_id}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [_serialize(v) for v in vitals]


@router.get("/live")
async def get_live_vitals(current_user: dict = Depends(get_current_user)):
    """Return the latest vital for each patient"""
    db = get_db()
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {"_id": "$patient_id", "latest": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$latest"}},
    ]
    results = await db.vitals.aggregate(pipeline).to_list(200)
    return [_serialize(v) for v in results]
