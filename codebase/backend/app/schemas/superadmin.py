from datetime import datetime

from pydantic import BaseModel, EmailStr


class SuperAdminOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class BusinessSummary(BaseModel):
    id: int
    name: str
    email: EmailStr
    booking_key: str
    is_active: bool
    plan: str
    status: str
    trial_ends_at: datetime | None
    approved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalRequest(BaseModel):
    note: str | None = None


class PlatformSettingUpdate(BaseModel):
    require_approval: bool | None = None
    trial_duration_days: int | None = None


class PlatformSettingsOut(BaseModel):
    require_approval: bool
    trial_duration_days: int
