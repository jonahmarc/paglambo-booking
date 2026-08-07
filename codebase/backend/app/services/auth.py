import secrets

from sqlalchemy.orm import Session as DBSession

from app.models import Business
from app.services.security import hash_password, verify_password


def generate_booking_key() -> str:
    return secrets.token_urlsafe(9)


def create_business(db: DBSession, *, name: str, email: str, password: str) -> Business:
    booking_key = generate_booking_key()
    while db.query(Business).filter_by(booking_key=booking_key).first():
        booking_key = generate_booking_key()

    business = Business(
        name=name,
        email=email,
        password_hash=hash_password(password),
        booking_key=booking_key,
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
