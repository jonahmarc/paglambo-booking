from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.event_type import EventTypeKind


class EventTypeCreate(BaseModel):
    name: str
    kind: EventTypeKind
    base_price: Decimal = Field(ge=0, decimal_places=2)
    description: str | None = None
    default_capacity: int = Field(default=1, ge=1)


class EventTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    default_capacity: int | None = Field(default=None, ge=1)
    base_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    is_active: bool | None = None


class EventTypeOut(BaseModel):
    id: int
    business_id: int
    name: str
    description: str | None
    kind: EventTypeKind
    default_capacity: int
    base_price: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
