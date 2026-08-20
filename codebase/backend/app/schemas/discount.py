from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.models.discount import DiscountType


class DiscountCodeCreate(BaseModel):
    code: str
    type: DiscountType
    value: Decimal
    max_uses: int | None = None
    expires_at: datetime | None = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Code cannot be empty")
        if len(v) > 50:
            raise ValueError("Code must be 50 characters or fewer")
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Value must be greater than zero")
        return v


class DiscountCodeUpdate(BaseModel):
    is_active: bool | None = None
    max_uses: int | None = None
    expires_at: datetime | None = None


class DiscountCodeOut(BaseModel):
    id: int
    code: str
    type: DiscountType
    value: Decimal
    max_uses: int | None
    use_count: int
    is_active: bool
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DiscountValidateOut(BaseModel):
    valid: bool
    code: str
    type: DiscountType
    discount_amount: Decimal
    message: str | None = None
