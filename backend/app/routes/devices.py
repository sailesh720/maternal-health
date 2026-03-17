"""Device monitoring routes"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter()


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_devices(current_user: dict = Depends(get_current_user)):
    db = get_db()
    devices = await db.devices.find({}).to_list(200)
    result = []
    for d in devices:
        d = _serialize(d)
        if d.get("patient_id"):
            patient = await db.patients.find_one({"_id": ObjectId(d["patient_id"])}, {"name": 1})
            d["patient_name"] = patient["name"] if patient else None
        result.append(d)
    return result


@router.get("/{device_id}")
async def get_device(device_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    device = await db.devices.find_one({"device_id": device_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return _serialize(device)
