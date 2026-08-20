from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr

from app.models.booking import BookingStatus
from app.schemas.payment import PaymentOut


class CustomerIn(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None


class AttendeeIn(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    id_or_passport: str | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    special_requirements: str | None = None


class AttendeeOut(BaseModel):
    id: int
    name: str
    email: str | None
    phone: str | None
    id_or_passport: str | None
    nationality: str | None
    date_of_birth: date | None
    special_requirements: str | None

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    event_type_id: int
    customer: CustomerIn
    party_size: int = 1
    session_ids: list[int] = []
    addon_ids: list[int] = []
    attendees: list[AttendeeIn] = []
    discount_code: str | None = None
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
    booking_ref: str
    event_type_id: int
    event_type_name: str
    event_type_visibility: str
    status: BookingStatus
    party_size: int
    total_price: Decimal
    discount_code: str | None
    discount_amount: Decimal | None
    notes: str | None
    customer: BookingCustomerOut
    sessions: list[BookingSessionOut]
    add_ons: list[BookingAddonOut]
    attendees: list[AttendeeOut]
    payment: PaymentOut | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingPublicOut(BaseModel):
    id: int
    booking_ref: str
    status: BookingStatus
    party_size: int
    total_price: Decimal
    discount_code: str | None = None
    discount_amount: Decimal | None = None
    notes: str | None
    business_name: str
    business_email: str
    paypal_username: str | None
    wise_username: str | None
    sessions: list[BookingSessionOut]
    add_ons: list[BookingAddonOut]
    created_at: datetime
