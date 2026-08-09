from datetime import datetime, timezone

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from jose import JWTError
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, PlatformSetting, SuperAdmin, SubscriptionPayment
from app.routers.deps import (
    create_superadmin_access_token,
    create_superadmin_refresh_token,
    get_current_superadmin,
    get_platform_settings,
)
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.subscription import SubscriptionPaymentAdminOut, SubscriptionPaymentReview
from app.schemas.superadmin import (
    ApprovalRequest,
    BusinessSummary,
    PlatformSettingsOut,
    PlatformSettingUpdate,
    SuperAdminOut,
)
from app.services.auth import (
    activate_business_subscription,
    approve_business,
    authenticate_superadmin,
    reject_business,
)
from app.services.email import (
    send_registration_approved,
    send_registration_rejected,
    send_subscription_approved,
    send_subscription_rejected,
)
from app.services.security import decode_token

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


# --- Auth ---

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


# --- Platform settings ---

@router.get("/settings", response_model=PlatformSettingsOut)
def get_settings(
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    s = get_platform_settings(db)
    return PlatformSettingsOut(
        require_approval=s["require_approval"],
        trial_duration_days=s["trial_duration_days"],
    )


@router.patch("/settings", response_model=PlatformSettingsOut)
def update_settings(
    payload: PlatformSettingUpdate,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    if payload.require_approval is not None:
        _upsert_setting(db, "require_approval", "true" if payload.require_approval else "false")
    if payload.trial_duration_days is not None:
        if payload.trial_duration_days < 1:
            raise HTTPException(status_code=400, detail="trial_duration_days must be at least 1")
        _upsert_setting(db, "trial_duration_days", str(payload.trial_duration_days))
    db.commit()
    s = get_platform_settings(db)
    return PlatformSettingsOut(
        require_approval=s["require_approval"],
        trial_duration_days=s["trial_duration_days"],
    )


def _upsert_setting(db: DBSession, key: str, value: str) -> None:
    setting = db.get(PlatformSetting, key)
    if setting:
        setting.value = value
    else:
        db.add(PlatformSetting(key=key, value=value))


# --- Businesses ---

@router.get("/businesses", response_model=list[BusinessSummary])
def list_businesses(
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    return db.query(Business).order_by(Business.created_at.desc()).all()


@router.post("/businesses/{business_id}/approve", response_model=BusinessSummary)
def approve_registration(
    business_id: int,
    payload: ApprovalRequest,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    business = _get_business_or_404(db, business_id)
    if business.status not in ("pending_approval", "rejected"):
        raise HTTPException(status_code=400, detail="Business is not pending approval")

    s = get_platform_settings(db)
    business = approve_business(db, business, trial_days=s["trial_duration_days"])
    send_registration_approved(business)
    return business


@router.post("/businesses/{business_id}/reject", response_model=BusinessSummary)
def reject_registration(
    business_id: int,
    payload: ApprovalRequest,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    business = _get_business_or_404(db, business_id)
    if business.status not in ("pending_approval",):
        raise HTTPException(status_code=400, detail="Business is not pending approval")

    business = reject_business(db, business)
    send_registration_rejected(business, note=payload.note)
    return business


@router.patch("/businesses/{business_id}/activate", response_model=BusinessSummary)
def activate_business(
    business_id: int,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    business = _get_business_or_404(db, business_id)
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
    business = _get_business_or_404(db, business_id)
    business.is_active = False
    db.commit()
    db.refresh(business)
    return business


# --- Subscription payment review ---

@router.get("/subscription-payments", response_model=list[SubscriptionPaymentAdminOut])
def list_subscription_payments(
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    return (
        db.query(SubscriptionPayment)
        .order_by(SubscriptionPayment.created_at.desc())
        .all()
    )


@router.post("/subscription-payments/{payment_id}/approve", response_model=SubscriptionPaymentAdminOut)
def approve_subscription(
    payment_id: int,
    payload: SubscriptionPaymentReview,
    db: DBSession = Depends(get_db),
    current: SuperAdmin = Depends(get_current_superadmin),
):
    payment = _get_subscription_payment_or_404(db, payment_id)
    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="Payment has already been reviewed")

    payment.status = "approved"
    payment.review_note = payload.review_note
    payment.reviewed_at = datetime.now(timezone.utc)
    payment.reviewed_by_id = current.id
    db.commit()

    activate_business_subscription(db, payment.business)
    send_subscription_approved(payment.business)

    db.refresh(payment)
    return payment


@router.post("/subscription-payments/{payment_id}/reject", response_model=SubscriptionPaymentAdminOut)
def reject_subscription(
    payment_id: int,
    payload: SubscriptionPaymentReview,
    db: DBSession = Depends(get_db),
    current: SuperAdmin = Depends(get_current_superadmin),
):
    payment = _get_subscription_payment_or_404(db, payment_id)
    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="Payment has already been reviewed")

    from datetime import datetime, timezone
    payment.status = "rejected"
    payment.review_note = payload.review_note
    payment.reviewed_at = datetime.now(timezone.utc)
    payment.reviewed_by_id = current.id
    db.commit()
    db.refresh(payment)

    send_subscription_rejected(payment.business, note=payload.review_note)
    return payment


# --- Helpers ---

def _get_business_or_404(db: DBSession, business_id: int) -> Business:
    business = db.get(Business, business_id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return business


@router.get("/subscription-payments/{payment_id}/receipt")
def get_subscription_receipt(
    payment_id: int,
    db: DBSession = Depends(get_db),
    _: SuperAdmin = Depends(get_current_superadmin),
):
    payment = _get_subscription_payment_or_404(db, payment_id)
    path = Path(payment.receipt_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt file not found")
    return FileResponse(str(path))


def _get_subscription_payment_or_404(db: DBSession, payment_id: int) -> SubscriptionPayment:
    payment = db.get(SubscriptionPayment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment
