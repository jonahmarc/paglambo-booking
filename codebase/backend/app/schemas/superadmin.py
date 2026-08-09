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
    created_at: datetime

    model_config = {"from_attributes": True}
