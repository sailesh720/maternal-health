"""Alerts management routes"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


async def _enrich_with_patient_name(alerts: list, db) -> list:
    """Add patient name to alert objects"""
    for alert in alerts:
        patient = await db.patients.find_one({"_id": ObjectId(alert["patient_id"])}, {"name": 1})
        alert["patient_name"] = patient["name"] if patient else "Unknown"
    return alerts


@router.get("")
async def list_alerts(
    severity: str = Query(None),
    status: str = Query(None),
    village: str = Query(None),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query = {}
    if severity:
        query["severity"] = severity
    if status:
        query["status"] = status

    # If village filter, first get patient ids
    if village:
        patients = await db.patients.find({"village": village}, {"_id": 1}).to_list(200)
        patient_ids = [str(p["_id"]) for p in patients]
        query["patient_id"] = {"$in": patient_ids}

    alerts = await db.alerts.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    alerts = [_serialize(a) for a in alerts]
    return await _enrich_with_patient_name(alerts, db)


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.alerts.find_one_and_update(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": "acknowledged", "acknowledged_by": str(current_user["_id"])}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _serialize(result)


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.alerts.find_one_and_update(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _serialize(result)
