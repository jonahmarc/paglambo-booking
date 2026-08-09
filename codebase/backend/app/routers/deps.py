from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.database import get_db
from app.models import Business, PlatformSetting, SuperAdmin
from app.services.security import create_token, decode_token


def get_business_or_404(db: DBSession, booking_key: str) -> Business:
    business = (
        db.query(Business)
        .filter(Business.booking_key == booking_key, Business.is_active == True)  # noqa: E712
        .first()
    )
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    # Lazy-expire trial on request so we don't need a background job
    if (
        business.status == "trial"
        and business.trial_ends_at
        and business.trial_ends_at < datetime.now(timezone.utc)
    ):
        business.status = "expired"
        db.commit()

    if business.status not in ("trial", "active"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    return business


def get_platform_settings(db: DBSession):
    require = db.get(PlatformSetting, "require_approval")
    trial = db.get(PlatformSetting, "trial_duration_days")
    return {
        "require_approval": require is None or require.value == "true",
        "trial_duration_days": int(trial.value) if trial else 60,
    }


bearer_scheme = HTTPBearer()


def create_access_token(business_id: int) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(str(business_id), expires_delta, "access", role="business")


def create_refresh_token(business_id: int) -> str:
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    return create_token(str(business_id), expires_delta, "refresh", role="business")


def create_superadmin_access_token(superadmin_id: int) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return create_token(str(superadmin_id), expires_delta, "access", role="superadmin")


def create_superadmin_refresh_token(superadmin_id: int) -> str:
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    return create_token(str(superadmin_id), expires_delta, "refresh", role="superadmin")


def get_current_business(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: DBSession = Depends(get_db),
) -> Business:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise unauthorized

    if payload.get("type") != "access" or payload.get("role") not in (None, "business"):
        raise unauthorized

    business_id = payload.get("sub")
    if business_id is None:
        raise unauthorized

    business = db.get(Business, int(business_id))
    if business is None or not business.is_active:
        raise unauthorized

    # Lazy-expire trial — allow the business to still log in so they can upload a receipt
    if (
        business.status == "trial"
        and business.trial_ends_at
        and business.trial_ends_at < datetime.now(timezone.utc)
    ):
        business.status = "expired"
        db.commit()
        db.refresh(business)

    return business


def get_current_superadmin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: DBSession = Depends(get_db),
) -> SuperAdmin:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise unauthorized

    if payload.get("type") != "access" or payload.get("role") != "superadmin":
        raise unauthorized

    superadmin_id = payload.get("sub")
    if superadmin_id is None:
        raise unauthorized

    superadmin = db.get(SuperAdmin, int(superadmin_id))
    if superadmin is None:
        raise unauthorized

    return superadmin
