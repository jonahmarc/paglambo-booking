from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    plan: str = Field("standard", pattern="^(standard|pro)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class BusinessOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    booking_key: str
    is_active: bool
    plan: str
    status: str
    trial_ends_at: datetime | None

    model_config = {"from_attributes": True}
