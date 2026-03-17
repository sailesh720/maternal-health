"""
Maternal Health Monitoring Ecosystem - FastAPI Backend
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, disconnect_db
from app.routes import auth as auth_routes
from app.routes import patients, vitals, risk, alerts, visits, dashboard, simulation, devices, dataset, websocket
from app.services.simulator import VitalSimulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

simulator = VitalSimulator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    logger.info("Database connected")
    yield
    simulator.stop()
    await disconnect_db()
    logger.info("Database disconnected")

app = FastAPI(
    title="Maternal Health Monitoring API",
    description="Backend for ASHA worker maternal health tracking ecosystem",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(vitals.router, prefix="/vitals", tags=["Vitals"])
app.include_router(risk.router, prefix="/risk", tags=["Risk Engine"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(visits.router, prefix="/visits", tags=["Visits"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(simulation.router, prefix="/simulation", tags=["Simulation"])
app.include_router(devices.router, prefix="/devices", tags=["Devices"])
app.include_router(dataset.router, prefix="/dataset", tags=["Dataset"])
app.include_router(websocket.router, tags=["WebSocket"])

# Expose simulator to routes
app.state.simulator = simulator

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "maternal-health-api"}
