"""Dashboard summary and analytics routes"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    db = get_db()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    next_week = datetime.utcnow() + timedelta(days=7)

    total_patients = await db.patients.count_documents({})
    high_risk = await db.patients.count_documents({"risk_level": "high"})
    medium_risk = await db.patients.count_documents({"risk_level": "medium"})
    low_risk = await db.patients.count_documents({"risk_level": "low"})
    alerts_today = await db.alerts.count_documents({"created_at": {"$gte": today_start}})

    # Patients due for visit (no visit in 14 days)
    two_weeks_ago = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
    upcoming_visits = await db.visits.count_documents({"follow_up_date": {"$lte": next_week.strftime("%Y-%m-%d")}})
    villages = await db.patients.distinct("village")

    return {
        "total_patients": total_patients,
        "high_risk_count": high_risk,
        "medium_risk_count": medium_risk,
        "low_risk_count": low_risk,
        "alerts_today": alerts_today,
        "upcoming_checkups": upcoming_visits,
        "total_villages": len(villages),
    }


@router.get("/village-risk")
async def get_village_risk(current_user: dict = Depends(get_current_user)):
    db = get_db()
    villages = await db.patients.distinct("village")
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    result = []
    for village in villages:
        patients = await db.patients.find({"village": village}).to_list(200)
        patient_ids = [str(p["_id"]) for p in patients]

        high_risk = sum(1 for p in patients if p.get("risk_level") == "high")
        medium_risk = sum(1 for p in patients if p.get("risk_level") == "medium")

        # Get risk scores
        risks = await db.risk_assessments.find(
            {"patient_id": {"$in": patient_ids}}
        ).to_list(200)
        avg_score = sum(r.get("risk_score", 0) for r in risks) / len(risks) if risks else 0

        # Alerts today for this village
        alert_count = await db.alerts.count_documents({
            "patient_id": {"$in": patient_ids},
            "created_at": {"$gte": today_start},
        })

        district = patients[0].get("district", "Unknown") if patients else "Unknown"
        result.append({
            "village": village,
            "district": district,
            "total_patients": len(patients),
            "high_risk_count": high_risk,
            "medium_risk_count": medium_risk,
            "avg_risk_score": round(avg_score, 1),
            "latest_alert_count": alert_count,
        })

    return sorted(result, key=lambda x: x["high_risk_count"], reverse=True)


@router.get("/high-risk-patients")
async def get_high_risk_patients(current_user: dict = Depends(get_current_user)):
    db = get_db()
    patients = await db.patients.find({"risk_level": "high"}).to_list(50)
    result = []
    for p in patients:
        pid = str(p["_id"])
        latest_vital = await db.vitals.find_one({"patient_id": pid}, sort=[("timestamp", -1)])
        risk = await db.risk_assessments.find_one({"patient_id": pid}, sort=[("computed_at", -1)])
        result.append({
            "id": pid,
            "name": p["name"],
            "village": p["village"],
            "age": p["age"],
            "pregnancy_week": p["pregnancy_week"],
            "risk_score": risk["risk_score"] if risk else 0,
            "reasons": (risk["reasons"][:2] if risk else []),
            "last_vitals": latest_vital,
        })
    return result


@router.get("/trends")
async def get_trends(current_user: dict = Depends(get_current_user)):
    """Return daily alert counts for the last 7 days"""
    db = get_db()
    result = []
    for days_ago in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=days_ago)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.alerts.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        high = await db.alerts.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end},
            "severity": "high",
        })
        result.append({
            "date": day.strftime("%b %d"),
            "total_alerts": count,
            "high_severity": high,
        })
    return result
