import shutil
import uuid
from decimal import Decimal
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from sqlalchemy.orm import Session as DBSession

from app.models import Booking

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_receipt_file(booking_id: int, file: UploadFile) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Invalid file type. Accepted: JPEG, PNG, WEBP, PDF")

    # Read into memory to enforce size limit before writing to disk
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File is too large. Maximum size is 10 MB")

    upload_dir = Path(settings.upload_dir) / "receipts"
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "receipt").suffix.lower() or ".bin"
    filename = f"{booking_id}_{uuid.uuid4().hex}{suffix}"
    dest = upload_dir / filename

    with dest.open("wb") as f:
        f.write(content)

    return str(dest)


def create_payment(
    db: DBSession,
    booking: Booking,
    method: PaymentMethod,
    amount: Decimal,
    file_path: str,
) -> Payment:
    if booking.payment is not None:
        raise ValueError("A receipt has already been submitted for this booking")

    payment = Payment(
        booking_id=booking.id,
        method=method,
        amount=amount,
        receipt_file_path=file_path,
        status=PaymentStatus.AWAITING_PAYMENT,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_booking(db: DBSession, booking_id: int) -> Payment | None:
    return db.query(Payment).filter(Payment.booking_id == booking_id).first()
