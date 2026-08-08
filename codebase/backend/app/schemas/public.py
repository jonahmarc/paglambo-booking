from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.event_type import EventTypeKind
from app.models.package import PackageDateMode


class PublicAddOnOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal


class PublicSessionOut(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime | None
    available_spots: int


class PublicPackageOut(BaseModel):
    date_mode: PackageDateMode
    required_session_count: int
    # Pool sessions included for both modes:
    # FIXED   → informational (customer sees what dates they're committing to)
    # CUSTOMER_PICKS → customer selects required_session_count from this list
    pool_sessions: list[PublicSessionOut]


class PublicEventTypeOut(BaseModel):
    id: int
    name: str
    description: str | None
    kind: EventTypeKind
    base_price: Decimal
    add_ons: list[PublicAddOnOut]
    package: PublicPackageOut | None
