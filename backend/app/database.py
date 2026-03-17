"""
MongoDB connection using Motor (async MongoDB driver)
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "maternal_health")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)
    await db.patients.create_index("assigned_asha_worker_id")
    await db.patients.create_index("village")
    await db.vitals.create_index("patient_id")
    await db.vitals.create_index("timestamp")
    await db.alerts.create_index("patient_id")
    await db.alerts.create_index("status")
    await db.risk_assessments.create_index("patient_id")
    print(f"Connected to MongoDB: {DATABASE_NAME}")


async def disconnect_db():
    global client
    if client:
        client.close()


def get_db():
    return db
