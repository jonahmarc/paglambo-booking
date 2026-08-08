from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentOut(BaseModel):
    id: int
    booking_id: int
    method: PaymentMethod
    amount: Decimal
    status: PaymentStatus
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentReviewIn(BaseModel):
    note: str | None = None


class ReceiptUploadOut(BaseModel):
    booking_id: int
    booking_status: str
    payment: PaymentOut
