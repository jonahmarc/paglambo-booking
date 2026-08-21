from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.services.email import send_contact_inquiry

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    message: str


@router.post("")
def submit_contact(body: ContactIn):
    send_contact_inquiry(body.name, body.email, body.message)
    return {"ok": True}
