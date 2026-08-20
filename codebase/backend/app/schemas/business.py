import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

_SLUG_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class BusinessDetail(BaseModel):
    id: int
    name: str
    slug: str | None
    email: EmailStr
    booking_key: str
    paypal_username: str | None
    wise_username: str | None
    has_paypal_qr: bool = False
    has_wise_qr: bool = False
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
    slug: str | None = None
    paypal_username: str | None = None
    wise_username: str | None = None

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if len(v) < 3 or len(v) > 100:
            raise ValueError('Slug must be between 3 and 100 characters')
        if not _SLUG_RE.match(v):
            raise ValueError('Slug may only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)')
        return v
