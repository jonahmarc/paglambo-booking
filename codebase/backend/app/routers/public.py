from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, EventType
from app.models.event_type import EventTypeKind
from app.routers.deps import get_business_or_404
from app.schemas.public import PublicBusinessOut, PublicEventTypeOut, PublicSessionOut
from app.services.public import get_public_event_type, list_available_sessions, list_public_event_types

# Slug-based lookup — must be registered in main.py BEFORE the booking_key router
# so the literal path segment "by-slug" isn't captured by {booking_key}.
meta_router = APIRouter(prefix="/api/public", tags=["public"])

router = APIRouter(prefix="/api/public/{booking_key}", tags=["public"])


@meta_router.get("/by-slug/{slug}", response_model=PublicBusinessOut)
def get_by_slug(slug: str, db: DBSession = Depends(get_db)):
    business = (
        db.query(Business)
        .filter(Business.slug == slug, Business.is_active == True)  # noqa: E712
        .first()
    )
    if business is None or business.status not in ("trial", "active"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return PublicBusinessOut(
        name=business.name,
        slug=business.slug,
        booking_key=business.booking_key,
        email=business.email,
        paypal_username=business.paypal_username,
        wise_username=business.wise_username,
        has_paypal_qr=business.has_paypal_qr,
        has_wise_qr=business.has_wise_qr,
    )


@router.get("/qr/{method}")
def get_qr(
    booking_key: str,
    method: str,
    db: DBSession = Depends(get_db),
):
    if method not in ("paypal", "wise"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    business = get_business_or_404(db, booking_key)
    path = business.paypal_qr_path if method == "paypal" else business.wise_qr_path
    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No QR code on file")
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code file not found")
    return FileResponse(p)


@router.get("/event-types", response_model=list[PublicEventTypeOut])
def get_event_types(
    booking_key: str,
    db: DBSession = Depends(get_db),
):
    business = get_business_or_404(db, booking_key)
    return list_public_event_types(db, business.id)


@router.get("/event-types/{event_type_id}", response_model=PublicEventTypeOut)
def get_single_event_type(
    booking_key: str,
    event_type_id: int,
    db: DBSession = Depends(get_db),
):
    business = get_business_or_404(db, booking_key)
    et = get_public_event_type(db, business.id, event_type_id)
    if et is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    return et


@router.get("/event-types/{event_type_id}/sessions", response_model=list[PublicSessionOut])
def get_sessions(
    booking_key: str,
    event_type_id: int,
    db: DBSession = Depends(get_db),
):
    business = get_business_or_404(db, booking_key)
    event_type = (
        db.query(EventType)
        .filter(
            EventType.id == event_type_id,
            EventType.business_id == business.id,
            EventType.is_active == True,  # noqa: E712
        )
        .first()
    )
    if event_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    if event_type.kind == EventTypeKind.PACKAGE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the event-types listing to see package pool sessions",
        )
    return list_available_sessions(db, event_type_id)
