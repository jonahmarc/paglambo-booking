from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, SuperAdmin
from app.routers.deps import (
    create_superadmin_access_token,
    create_superadmin_refresh_token,
    get_current_superadmin,
)
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.superadmin import BusinessSummary, SuperAdminOut
from app.services.auth import authenticate_superadmin
from app.services.security import decode_token

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


@router.post("/auth/login", response_model=TokenResponse)
def superadmin_login(payload: LoginRequest, db: DBSession = Depends(get_db)):
    superadmin = authenticate_superadmin(db, email=payload.email, password=payload.password)
    if superadmin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(
        access_token=create_superadmin_access_token(superadmin.id),
        refresh_token=create_superadmin_refresh_token(superadmin.id),
    )


@router.post("/auth/refresh", response_model=TokenResponse)
def superadmin_refresh(payload: RefreshRequest, db: DBSession = Depends(get_db)):
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    try:
        token_data = decode_token(payload.refresh_token)
    except JWTError:
        raise unauthorized

    if token_data.get("type") != "refresh" or token_data.get("role") != "superadmin":
        raise unauthorized

    superadmin = db.get(SuperAdmin, int(token_data["sub"]))
    if superadmin is None:
        raise unauthorized

    return TokenResponse(
        access_token=create_superadmin_access_token(superadmin.id),
        refresh_token=create_superadmin_refresh_token(superadmin.id),
    )


@router.get("/auth/me", response_model=SuperAdminOut)
def superadmin_me(current: SuperAdmin = Depends(get_current_superadmin)):
    return current


@router.get("/businesses", response_model=list[BusinessSummary])
def list_businesses(
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    return db.query(Business).order_by(Business.created_at.desc()).all()


@router.patch("/businesses/{business_id}/activate", response_model=BusinessSummary)
def activate_business(
    business_id: int,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    business = db.get(Business, business_id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    business.is_active = True
    db.commit()
    db.refresh(business)
    return business


@router.patch("/businesses/{business_id}/deactivate", response_model=BusinessSummary)
def deactivate_business(
    business_id: int,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    business = db.get(Business, business_id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    business.is_active = False
    db.commit()
    db.refresh(business)
    return business
