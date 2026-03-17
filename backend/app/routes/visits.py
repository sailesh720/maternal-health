"""Visit tracking routes"""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.models.schemas import VisitCreate
from app.utils.auth import get_current_user

router = APIRouter()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("", status_code=201)
async def create_visit(body: VisitCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = body.dict()
    doc["asha_worker_id"] = str(current_user["_id"])
    doc["created_at"] = datetime.utcnow()
    result = await db.visits.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("")
async def list_visits(
    patient_id: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    elif current_user["role"] == "asha":
        query["asha_worker_id"] = str(current_user["_id"])

    visits = await db.visits.find(query).sort("visit_date", -1).to_list(100)
    return [_serialize(v) for v in visits]


@router.get("/patient/{patient_id}")
async def get_visits_for_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    visits = await db.visits.find({"patient_id": patient_id}).sort("visit_date", -1).to_list(50)
    return [_serialize(v) for v in visits]
