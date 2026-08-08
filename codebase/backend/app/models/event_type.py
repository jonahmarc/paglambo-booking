import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventTypeKind(str, enum.Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"
    PACKAGE = "package"


class EventType(Base):
    __tablename__ = "event_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    kind: Mapped[EventTypeKind] = mapped_column(SAEnum(EventTypeKind, name="event_type_kind"))
    default_capacity: Mapped[int] = mapped_column(default=1)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    business: Mapped["Business"] = relationship(back_populates="event_types")
    sessions: Mapped[list["Session"]] = relationship(back_populates="event_type")
    package: Mapped["Package | None"] = relationship(back_populates="event_type", uselist=False)
    add_ons: Mapped[list["AddOn"]] = relationship(back_populates="event_type")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="event_type")
