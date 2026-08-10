from sqlalchemy import delete as sa_delete
from sqlalchemy.orm import Session as DBSession

from app.models import AddOn, Booking, EventType, package_session_pool
from app.models.session import Session as SessionModel, SessionStatus
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
    updates = data.model_dump(exclude_unset=True)
    new_capacity = updates.get("default_capacity")
    for field, value in updates.items():
        setattr(event_type, field, value)
    if new_capacity is not None:
        db.query(SessionModel).filter(
            SessionModel.event_type_id == event_type.id,
            SessionModel.status == SessionStatus.SCHEDULED,
        ).update({"capacity": new_capacity})
    db.commit()
    db.refresh(event_type)
    return event_type


def deactivate_event_type(db: DBSession, event_type: EventType) -> EventType:
    event_type.is_active = False
    db.commit()
    db.refresh(event_type)
    return event_type


def delete_event_type_hard(db: DBSession, event_type: EventType) -> None:
    if db.query(Booking).filter(Booking.event_type_id == event_type.id).count() > 0:
        raise ValueError("Cannot delete: existing bookings are linked to this event type")

    session_ids = [s.id for s in event_type.sessions]
    if session_ids:
        db.execute(
            sa_delete(package_session_pool).where(
                package_session_pool.c.session_id.in_(session_ids)
            )
        )
        db.flush()
        db.query(SessionModel).filter(
            SessionModel.event_type_id == event_type.id
        ).delete(synchronize_session="fetch")
        db.flush()

    db.query(AddOn).filter(AddOn.event_type_id == event_type.id).delete(synchronize_session="fetch")
    db.flush()

    if event_type.package:
        db.delete(event_type.package)
        db.flush()

    db.delete(event_type)
    db.commit()
