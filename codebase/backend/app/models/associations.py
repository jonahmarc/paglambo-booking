from sqlalchemy import Column, ForeignKey, Table

from app.database import Base

package_session_pool = Table(
    "package_session_pool",
    Base.metadata,
    Column("package_id", ForeignKey("packages.id"), primary_key=True),
    Column("session_id", ForeignKey("sessions.id"), primary_key=True),
)

booking_sessions = Table(
    "booking_sessions",
    Base.metadata,
    Column("booking_id", ForeignKey("bookings.id"), primary_key=True),
    Column("session_id", ForeignKey("sessions.id"), primary_key=True),
)
