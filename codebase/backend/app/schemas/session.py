from datetime import date, datetime, time
from typing import Annotated

from pydantic import BaseModel, Field

from app.models.session import SessionStatus


class SessionCreate(BaseModel):
    start_time: datetime
    end_time: datetime | None = None
    capacity: int = Field(ge=1)


class SessionGenerateRequest(BaseModel):
    start_date: date
    end_date: date
    days_of_week: list[Annotated[int, Field(ge=0, le=6)]] = Field(
        description="Days to generate sessions on. 0=Monday … 6=Sunday."
    )
    start_time: time
    duration_minutes: int | None = Field(default=None, ge=1)
    capacity: int = Field(ge=1)
    timezone: str = "UTC"


class SessionUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    capacity: int | None = Field(default=None, ge=1)


class SessionOut(BaseModel):
    id: int
    event_type_id: int
    start_time: datetime
    end_time: datetime | None
    capacity: int
    booked_count: int = 0
    status: SessionStatus
    created_at: datetime

    model_config = {"from_attributes": True}
