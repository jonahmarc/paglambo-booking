import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import package_session_pool


class PackageDateMode(str, enum.Enum):
    FIXED = "fixed"
    CUSTOMER_PICKS = "customer_picks"


class Package(Base):
    __tablename__ = "packages"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type_id: Mapped[int] = mapped_column(ForeignKey("event_types.id"), unique=True, index=True)
    date_mode: Mapped[PackageDateMode] = mapped_column(SAEnum(PackageDateMode, name="package_date_mode"))
    required_session_count: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event_type: Mapped["EventType"] = relationship(back_populates="package")
    pool_sessions: Mapped[list["Session"]] = relationship(secondary=package_session_pool, back_populates="packages")
