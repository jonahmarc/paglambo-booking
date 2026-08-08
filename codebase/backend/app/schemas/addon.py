from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AddOnCreate(BaseModel):
    event_type_id: int
    name: str
    price: Decimal = Field(ge=0, decimal_places=2)
    description: str | None = None


class AddOnUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    is_active: bool | None = None


class AddOnOut(BaseModel):
    id: int
    event_type_id: int
    name: str
    description: str | None
    price: Decimal
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EstimateRequest(BaseModel):
    event_type_id: int
    addon_ids: list[int] = []


class EstimateLineItem(BaseModel):
    id: int
    name: str
    price: Decimal


class EstimateOut(BaseModel):
    base_price: Decimal
    add_ons: list[EstimateLineItem]
    total: Decimal
