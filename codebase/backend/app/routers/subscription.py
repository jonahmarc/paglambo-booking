import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.database import get_db
from app.models import Business, SuperAdmin, SubscriptionPayment
from app.routers.deps import get_current_business
from app.schemas.subscription import SubscriptionPaymentOut
from app.services.email import send_subscription_receipt_received

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.post("/receipt", response_model=SubscriptionPaymentOut, status_code=status.HTTP_201_CREATED)
async def upload_subscription_receipt(
    file: UploadFile = File(...),
    current_business: Business = Depends(get_current_business),
    db: DBSession = Depends(get_db),
):
    if current_business.status not in ("pending_approval", "trial", "expired", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your subscription is already active",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid file type. Accepted: JPEG, PNG, WEBP, PDF",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File too large. Maximum size is 10 MB",
        )

    upload_dir = Path(settings.upload_dir) / "subscription_receipts"
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "receipt").suffix.lower() or ".bin"
    filename = f"{current_business.id}_{uuid.uuid4().hex}{suffix}"
    dest = upload_dir / filename
    with dest.open("wb") as f:
        f.write(content)

    payment = SubscriptionPayment(
        business_id=current_business.id,
        receipt_path=str(dest),
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    superadmin = db.query(SuperAdmin).first()
    if superadmin:
        send_subscription_receipt_received(current_business, superadmin.email)

    return payment


@router.get("/my-payments", response_model=list[SubscriptionPaymentOut])
def list_my_payments(
    current_business: Business = Depends(get_current_business),
    db: DBSession = Depends(get_db),
):
    return (
        db.query(SubscriptionPayment)
        .filter(SubscriptionPayment.business_id == current_business.id)
        .order_by(SubscriptionPayment.created_at.desc())
        .all()
    )
