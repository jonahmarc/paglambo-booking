import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import booking_addons, booking_sessions


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    AWAITING_PAYMENT = "awaiting_payment"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    event_type_id: Mapped[int] = mapped_column(ForeignKey("event_types.id"), index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"), default=BookingStatus.PENDING
    )
    party_size: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    discount_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    discount_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    business: Mapped["Business"] = relationship(back_populates="bookings")
    event_type: Mapped["EventType"] = relationship(back_populates="bookings")
    customer: Mapped["Customer"] = relationship(back_populates="bookings")
    sessions: Mapped[list["Session"]] = relationship(secondary=booking_sessions, back_populates="bookings")
    add_ons: Mapped[list["AddOn"]] = relationship(secondary=booking_addons, back_populates="bookings")
    payment: Mapped["Payment | None"] = relationship(back_populates="booking", uselist=False)
    attendees: Mapped[list["Attendee"]] = relationship(back_populates="booking", cascade="all, delete-orphan")

    @property
    def event_type_name(self) -> str:
        return self.event_type.name

    @property
    def event_type_visibility(self) -> str:
        return self.event_type.visibility

    @property
    def booking_ref(self) -> str:
        return str(self.id).zfill(6)
