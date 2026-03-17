"""Auth routes: OTP, login, me"""
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models.schemas import OTPRequest, OTPVerify, LoginRequest, TokenResponse
from app.utils.auth import (
    generate_otp, verify_otp, hash_password, verify_password,
    create_access_token, get_current_user
)

router = APIRouter()


@router.post("/request-otp")
async def request_otp(body: OTPRequest):
    otp = generate_otp(body.phone)
    return {"message": f"OTP sent to {body.phone}", "demo_otp": otp}


@router.post("/verify-otp")
async def verify_otp_route(body: OTPVerify):
    if not verify_otp(body.phone, body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"message": "OTP verified successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    query = {}
    if body.email:
        query["email"] = body.email
    elif body.phone:
        query["phone"] = body.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")

    user = await db.users.find_one(query)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return TokenResponse(
        access_token=token,
        role=user["role"],
        user_id=str(user["_id"]),
        name=user["name"],
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "phone": current_user["phone"],
        "role": current_user["role"],
        "assigned_villages": current_user.get("assigned_villages", []),
    }
