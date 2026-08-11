from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    booking_key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    paypal_username: Mapped[str | None] = mapped_column(String(255))
    wise_username: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    plan: Mapped[str] = mapped_column(String(20), default="standard")  # standard | pro
    # pending_approval | trial | active | expired | rejected | suspended
    status: Mapped[str] = mapped_column(String(30), default="pending_approval")
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    event_types: Mapped[list["EventType"]] = relationship(back_populates="business")
    customers: Mapped[list["Customer"]] = relationship(back_populates="business")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="business")
    subscription_payments: Mapped[list["SubscriptionPayment"]] = relationship(back_populates="business")
