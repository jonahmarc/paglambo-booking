from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, BookingStatus
from app.models.payment import PaymentMethod
from app.routers.deps import get_current_business
from app.schemas.booking import BookingCreate, BookingOut, BookingPublicOut
from app.schemas.payment import PaymentOut, ReceiptUploadOut
from app.services.booking import create_booking, get_booking, list_bookings, transition_to_awaiting_payment
from app.services.payment import create_payment, save_receipt_file

router = APIRouter(tags=["bookings"])


def _get_business_by_key(db: DBSession, booking_key: str) -> Business:
    business = (
        db.query(Business)
        .filter(Business.booking_key == booking_key, Business.is_active == True)  # noqa: E712
        .first()
    )
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return business


def _get_or_404(db: DBSession, business_id: int, booking_id: int):
    booking = get_booking(db, business_id, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


# --- Public endpoint (used by the booking widget) ---

@router.post(
    "/api/public/{booking_key}/bookings",
    response_model=BookingPublicOut,
    status_code=status.HTTP_201_CREATED,
)
def create_public_booking(
    booking_key: str,
    payload: BookingCreate,
    db: DBSession = Depends(get_db),
):
    business = _get_business_by_key(db, booking_key)
    try:
        booking = create_booking(db, business.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return BookingPublicOut(
        id=booking.id,
        status=booking.status,
        total_price=booking.total_price,
        notes=booking.notes,
        paypal_username=business.paypal_username,
        wise_username=business.wise_username,
        sessions=booking.sessions,
        add_ons=booking.add_ons,
        created_at=booking.created_at,
    )


@router.post(
    "/api/public/{booking_key}/bookings/{booking_id}/receipt",
    response_model=ReceiptUploadOut,
)
async def upload_receipt(
    booking_key: str,
    booking_id: int,
    method: PaymentMethod = Form(...),
    amount: Decimal = Form(...),
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
):
    business = _get_business_by_key(db, booking_key)
    booking = _get_or_404(db, business.id, booking_id)

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt can only be uploaded for bookings in PENDING status",
        )

    try:
        file_path = await save_receipt_file(booking_id, file)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    try:
        payment = create_payment(db, booking, method, amount, file_path)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    booking = transition_to_awaiting_payment(db, booking)

    return ReceiptUploadOut(
        booking_id=booking.id,
        booking_status=booking.status,
        payment=PaymentOut.model_validate(payment),
    )


# --- Admin endpoints ---

@router.get("/api/bookings", response_model=list[BookingOut])
def list_all(
    status: BookingStatus | None = Query(default=None),
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return list_bookings(db, current_business.id, status)


@router.get("/api/bookings/{booking_id}", response_model=BookingOut)
def get_one(
    booking_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return _get_or_404(db, current_business.id, booking_id)
