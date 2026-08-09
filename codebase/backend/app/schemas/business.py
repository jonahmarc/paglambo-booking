from datetime import datetime

from pydantic import BaseModel, EmailStr


class BusinessDetail(BaseModel):
    id: int
    name: str
    email: EmailStr
    booking_key: str
    paypal_username: str | None
    wise_username: str | None
    is_active: bool
    plan: str
    status: str
    trial_ends_at: datetime | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BusinessUpdate(BaseModel):
    name: str | None = None
    paypal_username: str | None = None
    wise_username: str | None = None
