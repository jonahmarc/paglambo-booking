from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.event_type import EventTypeKind, EventTypeVisibility
from app.models.package import PackageDateMode


class PackageBrief(BaseModel):
    id: int
    required_session_count: int
    date_mode: PackageDateMode

    model_config = {"from_attributes": True}


class EventTypeCreate(BaseModel):
    name: str
    kind: EventTypeKind
    base_price: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    description: str | None = None
    location: str | None = None
    default_capacity: int = Field(default=1, ge=1)
    requires_payment: bool = True
    visibility: EventTypeVisibility = EventTypeVisibility.PUBLIC


class EventTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    default_capacity: int | None = Field(default=None, ge=1)
    base_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    is_active: bool | None = None
    requires_payment: bool | None = None
    visibility: EventTypeVisibility | None = None


class EventTypeOut(BaseModel):
    id: int
    business_id: int
    name: str
    description: str | None
    location: str | None
    kind: EventTypeKind
    default_capacity: int
    base_price: Decimal
    is_active: bool
    requires_payment: bool
    visibility: EventTypeVisibility
    created_at: datetime
    updated_at: datetime
    package: PackageBrief | None = None

    model_config = {"from_attributes": True}
