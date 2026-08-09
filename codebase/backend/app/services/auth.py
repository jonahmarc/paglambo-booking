import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session as DBSession

from app.models import Business, PlatformSetting, SuperAdmin
from app.services.security import hash_password, verify_password


def generate_booking_key() -> str:
    return secrets.token_urlsafe(9)


def _get_trial_duration(db: DBSession) -> int:
    setting = db.get(PlatformSetting, "trial_duration_days")
    return int(setting.value) if setting else 60


def _approval_required(db: DBSession) -> bool:
    setting = db.get(PlatformSetting, "require_approval")
    return setting is None or setting.value == "true"


def create_business(db: DBSession, *, name: str, email: str, password: str, plan: str = "standard") -> Business:
    booking_key = generate_booking_key()
    while db.query(Business).filter_by(booking_key=booking_key).first():
        booking_key = generate_booking_key()

    if _approval_required(db):
        initial_status = "pending_approval"
        trial_ends_at = None
        approved_at = None
    else:
        trial_days = _get_trial_duration(db)
        initial_status = "trial"
        trial_ends_at = datetime.now(timezone.utc) + timedelta(days=trial_days)
        approved_at = datetime.now(timezone.utc)

    business = Business(
        name=name,
        email=email,
        password_hash=hash_password(password),
        booking_key=booking_key,
        plan=plan,
        status=initial_status,
        trial_ends_at=trial_ends_at,
        approved_at=approved_at,
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


def authenticate_business(db: DBSession, *, email: str, password: str) -> Business | None:
    business = db.query(Business).filter_by(email=email).first()
    if business is None or not verify_password(password, business.password_hash):
        return None
    return business


def approve_business(db: DBSession, business: Business, trial_days: int) -> Business:
    business.status = "trial"
    business.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=trial_days)
    business.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(business)
    return business


def reject_business(db: DBSession, business: Business) -> Business:
    business.status = "rejected"
    db.commit()
    db.refresh(business)
    return business


def activate_business_subscription(db: DBSession, business: Business) -> Business:
    business.status = "active"
    db.commit()
    db.refresh(business)
    return business


def create_superadmin(db: DBSession, *, email: str, password: str) -> SuperAdmin:
    superadmin = SuperAdmin(email=email, password_hash=hash_password(password))
    db.add(superadmin)
    db.commit()
    db.refresh(superadmin)
    return superadmin


def authenticate_superadmin(db: DBSession, *, email: str, password: str) -> SuperAdmin | None:
    superadmin = db.query(SuperAdmin).filter_by(email=email).first()
    if superadmin is None or not verify_password(password, superadmin.password_hash):
        return None
    return superadmin
