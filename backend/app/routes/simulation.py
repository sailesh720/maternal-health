"""Simulation control routes"""
from fastapi import APIRouter, Depends, Request
from app.utils.auth import get_current_user, require_role

router = APIRouter()


@router.post("/start")
async def start_simulation(request: Request, current_user: dict = Depends(get_current_user)):
    simulator = request.app.state.simulator
    from app.routes.websocket import broadcast_to_clients
    simulator.set_broadcaster(broadcast_to_clients)
    simulator.start()
    return {"message": "Simulation started", "running": simulator.is_running()}


@router.post("/stop")
async def stop_simulation(request: Request, current_user: dict = Depends(get_current_user)):
    simulator = request.app.state.simulator
    simulator.stop()
    return {"message": "Simulation stopped", "running": simulator.is_running()}


@router.get("/status")
async def simulation_status(request: Request):
    simulator = request.app.state.simulator
    return {"running": simulator.is_running()}


@router.post("/seed-demo-data")
async def seed_demo_data(request: Request, current_user: dict = Depends(get_current_user)):
    """Trigger the seed script from API"""
    from scripts.seed import run_seed
    await run_seed()
    return {"message": "Demo data seeded successfully"}
