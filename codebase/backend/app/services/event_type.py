from sqlalchemy.orm import Session as DBSession

from app.models import EventType
from app.schemas.event_type import EventTypeCreate, EventTypeUpdate


def create_event_type(db: DBSession, business_id: int, data: EventTypeCreate) -> EventType:
    event_type = EventType(business_id=business_id, **data.model_dump())
    db.add(event_type)
    db.commit()
    db.refresh(event_type)
    return event_type


def list_event_types(db: DBSession, business_id: int, include_inactive: bool = False) -> list[EventType]:
    q = db.query(EventType).filter(EventType.business_id == business_id)
    if not include_inactive:
        q = q.filter(EventType.is_active == True)  # noqa: E712
    return q.order_by(EventType.created_at).all()


def get_event_type(db: DBSession, business_id: int, event_type_id: int) -> EventType | None:
    return (
        db.query(EventType)
        .filter(EventType.id == event_type_id, EventType.business_id == business_id)
        .first()
    )


def update_event_type(db: DBSession, event_type: EventType, data: EventTypeUpdate) -> EventType:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event_type, field, value)
    db.commit()
    db.refresh(event_type)
    return event_type


def deactivate_event_type(db: DBSession, event_type: EventType) -> EventType:
    event_type.is_active = False
    db.commit()
    db.refresh(event_type)
    return event_type
