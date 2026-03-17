"""
Seed script — creates all demo data for Maternal Health Monitoring Ecosystem.

Run directly:
    cd backend
    python -m scripts.seed

Or from the API:
    POST /simulation/seed-demo-data
"""
import asyncio
import random
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext
from bson import ObjectId

from app.services.risk_engine import risk_engine, VitalInput

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "maternal_health")

import warnings
warnings.filterwarnings("ignore")
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b",
)
# ── Static demo data ──────────────────────────────────────────────────────────

VILLAGES = [
    {"name": "Rampur",     "district": "Varanasi"},
    {"name": "Sitapur",    "district": "Lucknow"},
    {"name": "Devgarh",    "district": "Varanasi"},
    {"name": "Chandpur",   "district": "Allahabad"},
    {"name": "Nandgaon",   "district": "Allahabad"},
]

USERS = [
    # ASHA workers
    {
        "name": "Priya Sharma",
        "email": "priya@asha.gov.in",
        "phone": "9876543210",
        "role": "asha",
        "password": "demo1234",
        "assigned_region": "Varanasi",
        "assigned_villages": ["Rampur", "Devgarh"],
    },
    {
        "name": "Sunita Verma",
        "email": "sunita@asha.gov.in",
        "phone": "9876543211",
        "role": "asha",
        "password": "demo1234",
        "assigned_region": "Lucknow",
        "assigned_villages": ["Sitapur"],
    },
    {
        "name": "Kavya Rao",
        "email": "kavya@asha.gov.in",
        "phone": "9876543212",
        "role": "asha",
        "password": "demo1234",
        "assigned_region": "Allahabad",
        "assigned_villages": ["Chandpur", "Nandgaon"],
    },
    # Doctors
    {
        "name": "Dr. Anil Mehta",
        "email": "anil@hospital.gov.in",
        "phone": "9876543220",
        "role": "doctor",
        "password": "demo1234",
        "assigned_region": "Varanasi",
        "assigned_villages": [],
    },
    {
        "name": "Dr. Rekha Joshi",
        "email": "rekha@hospital.gov.in",
        "phone": "9876543221",
        "role": "doctor",
        "password": "demo1234",
        "assigned_region": "Allahabad",
        "assigned_villages": [],
    },
    # Admins
    {
        "name": "Admin User",
        "email": "admin@health.gov.in",
        "phone": "9876543230",
        "role": "admin",
        "password": "admin1234",
        "assigned_region": "All",
        "assigned_villages": [],
    },
]

# Named patients per spec + extras
PATIENTS_DATA = [
    # ── Rampur (Varanasi) ─────────────────────────────
    {
        "name": "Sunita Devi",
        "age": 24,
        "village": "Rampur",
        "district": "Varanasi",
        "phone": "9811100001",
        "pregnancy_week": 32,
        "expected_due_date": "2025-03-15",
        "medical_conditions": ["anaemia"],
        "emergency_contact": "9811100002",
        "profile": "medium_risk",
    },
    {
        "name": "Meena Kumari",
        "age": 19,
        "village": "Rampur",
        "district": "Varanasi",
        "phone": "9811100003",
        "pregnancy_week": 28,
        "expected_due_date": "2025-04-10",
        "medical_conditions": ["hypertension"],
        "emergency_contact": "9811100004",
        "profile": "high_risk",
    },
    {
        "name": "Kavita Bai",
        "age": 29,
        "village": "Rampur",
        "district": "Varanasi",
        "phone": "9811100005",
        "pregnancy_week": 20,
        "expected_due_date": "2025-06-01",
        "medical_conditions": [],
        "emergency_contact": "9811100006",
        "profile": "stable",
    },
    {
        "name": "Rani Patel",
        "age": 36,
        "village": "Rampur",
        "district": "Varanasi",
        "phone": "9811100007",
        "pregnancy_week": 35,
        "expected_due_date": "2025-02-20",
        "medical_conditions": ["gestational diabetes", "hypertension"],
        "emergency_contact": "9811100008",
        "profile": "high_risk",
    },
    {
        "name": "Geeta Singh",
        "age": 27,
        "village": "Rampur",
        "district": "Varanasi",
        "phone": "9811100009",
        "pregnancy_week": 16,
        "expected_due_date": "2025-07-05",
        "medical_conditions": [],
        "emergency_contact": "9811100010",
        "profile": "stable",
    },
    # ── Sitapur (Lucknow) ─────────────────────────────
    {
        "name": "Anjali Mishra",
        "age": 22,
        "village": "Sitapur",
        "district": "Lucknow",
        "phone": "9811200001",
        "pregnancy_week": 30,
        "expected_due_date": "2025-03-28",
        "medical_conditions": ["anaemia"],
        "emergency_contact": "9811200002",
        "profile": "medium_risk",
    },
    {
        "name": "Pooja Yadav",
        "age": 31,
        "village": "Sitapur",
        "district": "Lucknow",
        "phone": "9811200003",
        "pregnancy_week": 38,
        "expected_due_date": "2025-01-30",
        "medical_conditions": ["diabetes"],
        "emergency_contact": "9811200004",
        "profile": "high_risk",
    },
    {
        "name": "Rekha Tiwari",
        "age": 25,
        "village": "Sitapur",
        "district": "Lucknow",
        "phone": "9811200005",
        "pregnancy_week": 12,
        "expected_due_date": "2025-08-15",
        "medical_conditions": [],
        "emergency_contact": "9811200006",
        "profile": "stable",
    },
    {
        "name": "Suman Gupta",
        "age": 34,
        "village": "Sitapur",
        "district": "Lucknow",
        "phone": "9811200007",
        "pregnancy_week": 26,
        "expected_due_date": "2025-04-20",
        "medical_conditions": ["hypertension"],
        "emergency_contact": "9811200008",
        "profile": "medium_risk",
    },
    {
        "name": "Nisha Pandey",
        "age": 21,
        "village": "Sitapur",
        "district": "Lucknow",
        "phone": "9811200009",
        "pregnancy_week": 8,
        "expected_due_date": "2025-09-10",
        "medical_conditions": [],
        "emergency_contact": "9811200010",
        "profile": "stable",
    },
    # ── Devgarh (Varanasi) ────────────────────────────
    {
        "name": "Savita Chauhan",
        "age": 28,
        "village": "Devgarh",
        "district": "Varanasi",
        "phone": "9811300001",
        "pregnancy_week": 22,
        "expected_due_date": "2025-05-18",
        "medical_conditions": [],
        "emergency_contact": "9811300002",
        "profile": "stable",
    },
    {
        "name": "Laxmi Pal",
        "age": 17,
        "village": "Devgarh",
        "district": "Varanasi",
        "phone": "9811300003",
        "pregnancy_week": 18,
        "expected_due_date": "2025-06-25",
        "medical_conditions": ["anaemia"],
        "emergency_contact": "9811300004",
        "profile": "high_risk",
    },
    {
        "name": "Usha Rani",
        "age": 30,
        "village": "Devgarh",
        "district": "Varanasi",
        "phone": "9811300005",
        "pregnancy_week": 34,
        "expected_due_date": "2025-02-28",
        "medical_conditions": [],
        "emergency_contact": "9811300006",
        "profile": "stable",
    },
    {
        "name": "Pushpa Maurya",
        "age": 38,
        "village": "Devgarh",
        "district": "Varanasi",
        "phone": "9811300007",
        "pregnancy_week": 36,
        "expected_due_date": "2025-02-10",
        "medical_conditions": ["hypertension", "anaemia"],
        "emergency_contact": "9811300008",
        "profile": "high_risk",
    },
    {
        "name": "Manju Dubey",
        "age": 26,
        "village": "Devgarh",
        "district": "Varanasi",
        "phone": "9811300009",
        "pregnancy_week": 14,
        "expected_due_date": "2025-07-30",
        "medical_conditions": [],
        "emergency_contact": "9811300010",
        "profile": "stable",
    },
    # ── Chandpur (Allahabad) ──────────────────────────
    {
        "name": "Champa Devi",
        "age": 23,
        "village": "Chandpur",
        "district": "Allahabad",
        "phone": "9811400001",
        "pregnancy_week": 24,
        "expected_due_date": "2025-05-05",
        "medical_conditions": ["gestational diabetes"],
        "emergency_contact": "9811400002",
        "profile": "medium_risk",
    },
    {
        "name": "Sarita Keshari",
        "age": 33,
        "village": "Chandpur",
        "district": "Allahabad",
        "phone": "9811400003",
        "pregnancy_week": 40,
        "expected_due_date": "2025-01-15",
        "medical_conditions": ["preeclampsia"],
        "emergency_contact": "9811400004",
        "profile": "high_risk",
    },
    {
        "name": "Bindu Verma",
        "age": 27,
        "village": "Chandpur",
        "district": "Allahabad",
        "phone": "9811400005",
        "pregnancy_week": 10,
        "expected_due_date": "2025-08-28",
        "medical_conditions": [],
        "emergency_contact": "9811400006",
        "profile": "stable",
    },
    {
        "name": "Kiran Sahu",
        "age": 20,
        "village": "Chandpur",
        "district": "Allahabad",
        "phone": "9811400007",
        "pregnancy_week": 27,
        "expected_due_date": "2025-04-12",
        "medical_conditions": ["anaemia"],
        "emergency_contact": "9811400008",
        "profile": "medium_risk",
    },
    {
        "name": "Radha Prajapati",
        "age": 29,
        "village": "Chandpur",
        "district": "Allahabad",
        "phone": "9811400009",
        "pregnancy_week": 19,
        "expected_due_date": "2025-06-18",
        "medical_conditions": [],
        "emergency_contact": "9811400010",
        "profile": "stable",
    },
    # ── Nandgaon (Allahabad) ──────────────────────────
    {
        "name": "Durga Mishra",
        "age": 35,
        "village": "Nandgaon",
        "district": "Allahabad",
        "phone": "9811500001",
        "pregnancy_week": 33,
        "expected_due_date": "2025-03-05",
        "medical_conditions": ["hypertension", "diabetes"],
        "emergency_contact": "9811500002",
        "profile": "high_risk",
    },
    {
        "name": "Prema Tripathi",
        "age": 25,
        "village": "Nandgaon",
        "district": "Allahabad",
        "phone": "9811500003",
        "pregnancy_week": 21,
        "expected_due_date": "2025-05-25",
        "medical_conditions": [],
        "emergency_contact": "9811500004",
        "profile": "stable",
    },
    {
        "name": "Gita Shukla",
        "age": 22,
        "village": "Nandgaon",
        "district": "Allahabad",
        "phone": "9811500005",
        "pregnancy_week": 29,
        "expected_due_date": "2025-04-02",
        "medical_conditions": ["anaemia"],
        "emergency_contact": "9811500006",
        "profile": "medium_risk",
    },
    {
        "name": "Vimla Chaurasia",
        "age": 41,
        "village": "Nandgaon",
        "district": "Allahabad",
        "phone": "9811500007",
        "pregnancy_week": 37,
        "expected_due_date": "2025-02-05",
        "medical_conditions": ["hypertension", "heart disease"],
        "emergency_contact": "9811500008",
        "profile": "high_risk",
    },
    {
        "name": "Sangeeta Yadav",
        "age": 26,
        "village": "Nandgaon",
        "district": "Allahabad",
        "phone": "9811500009",
        "pregnancy_week": 15,
        "expected_due_date": "2025-07-12",
        "medical_conditions": [],
        "emergency_contact": "9811500010",
        "profile": "stable",
    },
]

ALERT_TEMPLATES = [
    {
        "alert_type": "high_blood_pressure",
        "severity": "high",
        "message": "Blood pressure critically elevated",
        "suggested_action": "Immediate medical attention required",
    },
    {
        "alert_type": "abnormal_heart_rate",
        "severity": "medium",
        "message": "Elevated heart rate detected",
        "suggested_action": "Schedule doctor visit within 24 hours",
    },
    {
        "alert_type": "temperature_spike",
        "severity": "medium",
        "message": "Fever detected (38.2°C)",
        "suggested_action": "Monitor temperature, consider clinic visit",
    },
    {
        "alert_type": "missed_checkup",
        "severity": "low",
        "message": "Patient has not had a checkup in over 14 days",
        "suggested_action": "Schedule a follow-up visit",
    },
    {
        "alert_type": "low_oxygen",
        "severity": "high",
        "message": "Low oxygen saturation detected (93%)",
        "suggested_action": "Emergency evaluation required",
    },
]


def _gen_vitals(profile: str, days_ago: int = 0) -> dict:
    """Generate realistic vitals for a given profile"""
    ts = datetime.utcnow() - timedelta(days=days_ago, minutes=random.randint(0, 60))

    if profile == "stable":
        return {
            "heart_rate": round(random.uniform(72, 88), 1),
            "systolic_bp": round(random.uniform(105, 122), 1),
            "diastolic_bp": round(random.uniform(65, 79), 1),
            "temperature": round(random.uniform(36.5, 37.2), 1),
            "oxygen_level": round(random.uniform(97, 99), 1),
            "activity_level": round(random.uniform(35, 70), 1),
            "blood_sugar": round(random.uniform(85, 112), 1),
            "timestamp": ts,
            "source": "simulated",
        }
    elif profile == "medium_risk":
        return {
            "heart_rate": round(random.uniform(95, 112), 1),
            "systolic_bp": round(random.uniform(130, 148), 1),
            "diastolic_bp": round(random.uniform(82, 94), 1),
            "temperature": round(random.uniform(37.2, 38.0), 1),
            "oxygen_level": round(random.uniform(94, 97), 1),
            "activity_level": round(random.uniform(15, 45), 1),
            "blood_sugar": round(random.uniform(115, 148), 1),
            "timestamp": ts,
            "source": "simulated",
        }
    else:  # high_risk
        return {
            "heart_rate": round(random.uniform(112, 130), 1),
            "systolic_bp": round(random.uniform(148, 168), 1),
            "diastolic_bp": round(random.uniform(94, 110), 1),
            "temperature": round(random.uniform(37.8, 39.0), 1),
            "oxygen_level": round(random.uniform(90, 94), 1),
            "activity_level": round(random.uniform(0, 18), 1),
            "blood_sugar": round(random.uniform(150, 195), 1),
            "timestamp": ts,
            "source": "simulated",
        }


async def run_seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    print("🌱 Starting seed...")

    # ── Clear existing demo data ──────────────────────
    collections = ["users", "patients", "vitals", "risk_assessments",
                   "alerts", "visits", "devices"]
    for col in collections:
        await db[col].drop()
        print(f"  Cleared collection: {col}")

    # ── Re-create indexes ─────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)

    # ── Seed Users ────────────────────────────────────
    user_ids = {}
    for u in USERS:
        doc = {
            "name": u["name"],
            "email": u["email"],
            "phone": u["phone"],
            "role": u["role"],
            "password_hash": pwd_context.hash(u["password"]),
            "assigned_region": u.get("assigned_region"),
            "assigned_villages": u.get("assigned_villages", []),
            "created_at": datetime.utcnow(),
        }
        result = await db.users.insert_one(doc)
        user_ids[u["email"]] = str(result.inserted_id)
        print(f"  ✅ User: {u['name']} ({u['role']})")

    # Map villages to ASHA workers for assignment
    village_to_asha = {}
    for u in USERS:
        if u["role"] == "asha":
            for v in u.get("assigned_villages", []):
                village_to_asha[v] = user_ids[u["email"]]

    # Pick doctors by region
    varanasi_doctor = user_ids["anil@hospital.gov.in"]
    allahabad_doctor = user_ids["rekha@hospital.gov.in"]
    def get_doctor(district):
        return varanasi_doctor if district in ["Varanasi", "Lucknow"] else allahabad_doctor

    # ── Seed Patients + Devices ───────────────────────
    patient_ids = []
    device_counter = 1

    for idx, p in enumerate(PATIENTS_DATA):
        device_id = f"WD-{1000 + device_counter:04d}"
        device_counter += 1
        asha_id = village_to_asha.get(p["village"])
        doctor_id = get_doctor(p["district"])

        patient_doc = {
            "name": p["name"],
            "age": p["age"],
            "village": p["village"],
            "district": p["district"],
            "phone": p["phone"],
            "pregnancy_week": p["pregnancy_week"],
            "expected_due_date": p["expected_due_date"],
            "medical_conditions": p["medical_conditions"],
            "emergency_contact": p["emergency_contact"],
            "assigned_asha_worker_id": asha_id,
            "assigned_doctor_id": doctor_id,
            "device_id": device_id,
            "risk_level": None,
            "last_vitals_update": None,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(10, 90)),
        }
        result = await db.patients.insert_one(patient_doc)
        pid = str(result.inserted_id)
        patient_ids.append((pid, p["profile"], p["name"]))

        # Seed device
        await db.devices.insert_one({
            "device_id": device_id,
            "patient_id": pid,
            "battery_status": random.randint(25, 100),
            "connection_status": random.choice(["connected", "connected", "connected", "disconnected"]),
            "last_sync": datetime.utcnow() - timedelta(minutes=random.randint(1, 60)),
            "firmware_version": "2.1.4",
        })

        print(f"  ✅ Patient: {p['name']} ({p['village']}) — {p['profile']}")

    # ── Seed Historical Vitals (7 days, every 6h) ─────
    print("\n  Seeding historical vitals...")
    for (pid, profile, name) in patient_ids:
        for days_ago in range(7, 0, -1):
            for hour_offset in [0, 6, 12, 18]:
                vitals = _gen_vitals(profile, days_ago=days_ago)
                vitals["timestamp"] = (
                    datetime.utcnow()
                    - timedelta(days=days_ago, hours=hour_offset, minutes=random.randint(0, 30))
                )
                vitals["patient_id"] = pid
                await db.vitals.insert_one(vitals)

        # Latest vitals (today)
        latest = _gen_vitals(profile, days_ago=0)
        latest["patient_id"] = pid
        latest["timestamp"] = datetime.utcnow() - timedelta(minutes=random.randint(2, 20))
        await db.vitals.insert_one(latest)

    print("  ✅ Historical vitals seeded (7 days × 4 readings/day)")

    # ── Run Risk Engine on Latest Vitals ──────────────
    print("\n  Running risk engine on all patients...")
    for (pid, profile, name) in patient_ids:
        latest = await db.vitals.find_one({"patient_id": pid}, sort=[("timestamp", -1)])
        patient = await db.patients.find_one({"_id": ObjectId(pid)})
        if not latest:
            continue

        vi = VitalInput(
            patient_id=pid,
            age=patient["age"],
            pregnancy_week=patient["pregnancy_week"],
            systolic_bp=latest["systolic_bp"],
            diastolic_bp=latest["diastolic_bp"],
            heart_rate=latest["heart_rate"],
            body_temperature=latest["temperature"],
            oxygen_level=latest["oxygen_level"],
            activity_level=latest["activity_level"],
            blood_sugar=latest.get("blood_sugar"),
            known_conditions=patient.get("medical_conditions", []),
        )
        result = risk_engine.evaluate(vi)
        await db.risk_assessments.insert_one({
            "patient_id": pid,
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "reasons": result.reasons,
            "suggested_action": result.suggested_action,
            "computed_at": datetime.utcnow(),
        })
        await db.patients.update_one(
            {"_id": ObjectId(pid)},
            {"$set": {
                "risk_level": result.risk_level,
                "last_vitals_update": latest["timestamp"],
            }}
        )

    print("  ✅ Risk assessments computed")

    # ── Seed Alerts ───────────────────────────────────
    print("\n  Seeding alerts...")
    high_risk_patients = [(pid, name) for (pid, profile, name) in patient_ids if profile == "high_risk"]
    medium_risk_patients = [(pid, name) for (pid, profile, name) in patient_ids if profile == "medium_risk"]

    for (pid, name) in high_risk_patients:
        # 2–3 alerts per high-risk patient
        templates = random.sample(ALERT_TEMPLATES, k=random.randint(2, 3))
        for t in templates:
            await db.alerts.insert_one({
                "patient_id": pid,
                "alert_type": t["alert_type"],
                "severity": t["severity"],
                "message": t["message"],
                "suggested_action": t["suggested_action"],
                "status": random.choice(["new", "new", "acknowledged"]),
                "created_at": datetime.utcnow() - timedelta(hours=random.randint(0, 48)),
                "acknowledged_by": None,
                "resolved_at": None,
            })

    for (pid, name) in medium_risk_patients:
        # 1 alert per medium-risk patient
        t = random.choice(ALERT_TEMPLATES[1:3])
        await db.alerts.insert_one({
            "patient_id": pid,
            "alert_type": t["alert_type"],
            "severity": t["severity"],
            "message": t["message"],
            "suggested_action": t["suggested_action"],
            "status": "new",
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
            "acknowledged_by": None,
            "resolved_at": None,
        })

    print("  ✅ Alerts seeded")

    # ── Seed Visits ───────────────────────────────────
    print("\n  Seeding visit records...")
    for (pid, profile, name) in patient_ids:
        asha_id = None
        patient = await db.patients.find_one({"_id": ObjectId(pid)})
        asha_id = patient.get("assigned_asha_worker_id") or str(list(user_ids.values())[0])

        num_visits = random.randint(2, 5)
        for i in range(num_visits, 0, -1):
            visit_date = datetime.utcnow() - timedelta(days=i * 12 + random.randint(0, 5))
            follow_up = visit_date + timedelta(days=14)
            await db.visits.insert_one({
                "patient_id": pid,
                "asha_worker_id": asha_id,
                "visit_date": visit_date.strftime("%Y-%m-%d"),
                "notes": random.choice([
                    "Routine checkup completed. Patient in good health.",
                    "BP slightly elevated. Advised rest and reduced salt intake.",
                    "Iron supplements prescribed. Haemoglobin low.",
                    "Patient complained of swelling in feet. Referred to doctor.",
                    "Foetal movement normal. Weight gain appropriate.",
                    "Patient anxious. Counselling provided. Follow-up scheduled.",
                ]),
                "vitals_recorded": True,
                "medicine_provided": random.choice([
                    "Iron + Folic Acid tablets",
                    "Calcium supplements",
                    None,
                    "Antihypertensive (low dose)",
                ]),
                "follow_up_date": follow_up.strftime("%Y-%m-%d"),
                "created_at": visit_date,
            })

    print("  ✅ Visit records seeded")

    # ── Summary ───────────────────────────────────────
    total_patients = await db.patients.count_documents({})
    total_alerts = await db.alerts.count_documents({})
    total_vitals = await db.vitals.count_documents({})
    total_visits = await db.visits.count_documents({})
    total_devices = await db.devices.count_documents({})
    high_risk = await db.patients.count_documents({"risk_level": "high"})
    medium_risk = await db.patients.count_documents({"risk_level": "medium"})
    low_risk = await db.patients.count_documents({"risk_level": "low"})

    print("\n" + "=" * 50)
    print("🎉 Seed complete!")
    print(f"  👤 Users:    {len(USERS)} (ASHA ×3, Doctor ×2, Admin ×1)")
    print(f"  🤱 Patients: {total_patients} across {len(VILLAGES)} villages")
    print(f"  📊 Vitals:   {total_vitals} readings")
    print(f"  🚨 Alerts:   {total_alerts}")
    print(f"  📋 Visits:   {total_visits}")
    print(f"  📱 Devices:  {total_devices}")
    print(f"  🔴 High risk:   {high_risk}")
    print(f"  🟡 Medium risk: {medium_risk}")
    print(f"  🟢 Low risk:    {low_risk}")
    print("=" * 50)
    print("\n📝 Demo login credentials:")
    print("  ASHA worker: priya@asha.gov.in / demo1234")
    print("  Doctor:      anil@hospital.gov.in / demo1234")
    print("  Admin:       admin@health.gov.in / admin1234")
    print("  OTP (any phone): 123456")

    client.close()


if __name__ == "__main__":
    asyncio.run(run_seed())
