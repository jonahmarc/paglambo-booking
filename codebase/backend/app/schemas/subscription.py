from datetime import datetime

from pydantic import BaseModel


class SubscriptionPaymentOut(BaseModel):
    id: int
    business_id: int
    status: str
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionPaymentReview(BaseModel):
    review_note: str | None = None


class _BusinessMini(BaseModel):
    id: int
    name: str
    email: str
    plan: str
    status: str

    model_config = {"from_attributes": True}


class SubscriptionPaymentAdminOut(BaseModel):
    id: int
    business: _BusinessMini
    status: str
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
