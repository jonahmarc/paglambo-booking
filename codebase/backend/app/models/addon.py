from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import booking_addons


class AddOn(Base):
    __tablename__ = "add_ons"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type_id: Mapped[int] = mapped_column(ForeignKey("event_types.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event_type: Mapped["EventType"] = relationship(back_populates="add_ons")
    bookings: Mapped[list["Booking"]] = relationship(secondary=booking_addons, back_populates="add_ons")
