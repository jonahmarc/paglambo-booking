from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventTypePhoto(Base):
    __tablename__ = "event_type_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type_id: Mapped[int] = mapped_column(ForeignKey("event_types.id", ondelete="CASCADE"), index=True)
    file_path: Mapped[str] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event_type: Mapped["EventType"] = relationship(back_populates="photos")
