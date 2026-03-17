"""
WebSocket handler for real-time vitals and alerts streaming
"""
import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request

logger = logging.getLogger(__name__)
router = APIRouter()

# Active WebSocket connections
active_connections: Set[WebSocket] = set()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        dead = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception:
                dead.add(connection)
        for conn in dead:
            self.active_connections.discard(conn)


manager = ConnectionManager()


async def broadcast_to_clients(message: dict):
    """Called by simulator to push real-time updates"""
    await manager.broadcast(message)


@router.websocket("/ws/vitals")
async def websocket_vitals(websocket: WebSocket, request: Request):
    """
    WebSocket endpoint for real-time vital updates.
    Clients connect here to receive live vitals + alerts.
    """
    await manager.connect(websocket)
    # Inject broadcaster into simulator
    simulator = request.app.state.simulator
    simulator.set_broadcaster(broadcast_to_clients)

    try:
        while True:
            # Keep connection alive; data is pushed by simulator
            data = await websocket.receive_text()
            # Handle client messages (e.g., subscribe to specific patient)
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
