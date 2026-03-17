"""Authentication utilities"""
import os
import random
import warnings
from datetime import datetime, timedelta
from typing import Optional, Dict

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # NOTE: For production, always set SECRET_KEY in the environment.
    # This is intentionally not a secure default so the app can still run in dev.
    SECRET_KEY = "maternal-health-secret-key-change-in-prod"
    warnings.warn(
        "SECRET_KEY is not set; using insecure default. Set SECRET_KEY in env for production.",
        UserWarning,
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
OTP_EXPIRE_MINUTES = 10

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# In-memory OTP store (use Redis/Redis-like for multi-instance production)
otp_store: Dict[str, dict] = {}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_otp(phone: str) -> str:
    """Generate and store a 6-digit OTP (simulated).

    In production this should be backed by a durable store (Redis) and a real SMS service.
    """
    otp = os.getenv("DEMO_OTP")
    if not otp:
        otp = f"{random.randint(0, 999999):06d}"

    otp_store[phone] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    }
    print(f"[OTP SIMULATION] Sending OTP {otp} to {phone}")
    return otp


def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP from store"""
    stored = otp_store.get(phone)
    if not stored:
        return False

    if datetime.utcnow() > stored["expires"]:
        del otp_store[phone]
        return False

    if stored["otp"] != otp:
        return False

    del otp_store[phone]
    return True


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """FastAPI dependency to get current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    db = get_db()
    user = await db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["id"] = str(user["_id"])
    return user


def require_role(*roles):
    """Dependency factory to restrict endpoint by role"""

    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {roles}",
            )
        return current_user

    return role_checker
