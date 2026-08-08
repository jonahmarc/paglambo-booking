from datetime import datetime

from pydantic import BaseModel, Field

from app.models.package import PackageDateMode
from app.schemas.session import SessionOut


class PackageCreate(BaseModel):
    event_type_id: int
    date_mode: PackageDateMode
    required_session_count: int = Field(ge=1)


class PackageUpdate(BaseModel):
    date_mode: PackageDateMode | None = None
    required_session_count: int | None = Field(default=None, ge=1)


class PackagePoolAdd(BaseModel):
    session_id: int


class PackageOut(BaseModel):
    id: int
    event_type_id: int
    date_mode: PackageDateMode
    required_session_count: int
    created_at: datetime
    pool_sessions: list[SessionOut]

    model_config = {"from_attributes": True}
