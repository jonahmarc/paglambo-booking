from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr

from app.models.booking import BookingStatus


class CustomerIn(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None


class BookingCreate(BaseModel):
    event_type_id: int
    customer: CustomerIn
    session_ids: list[int] = []
    addon_ids: list[int] = []
    notes: str | None = None


class BookingSessionOut(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime | None

    model_config = {"from_attributes": True}


class BookingAddonOut(BaseModel):
    id: int
    name: str
    price: Decimal

    model_config = {"from_attributes": True}


class BookingCustomerOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None

    model_config = {"from_attributes": True}


class BookingOut(BaseModel):
    id: int
    event_type_id: int
    status: BookingStatus
    total_price: Decimal
    notes: str | None
    customer: BookingCustomerOut
    sessions: list[BookingSessionOut]
    add_ons: list[BookingAddonOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingPublicOut(BaseModel):
    id: int
    status: BookingStatus
    total_price: Decimal
    notes: str | None
    paypal_username: str | None
    wise_username: str | None
    sessions: list[BookingSessionOut]
    add_ons: list[BookingAddonOut]
    created_at: datetime
