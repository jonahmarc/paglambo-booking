from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.models import AddOn, Booking, BookingStatus, EventType, Session
from app.models import booking_sessions as booking_sessions_table
from app.models.event_type import EventTypeVisibility
from app.models.session import SessionStatus
from app.schemas.public import (
    PublicAddOnOut,
    PublicEventTypeOut,
    PublicPackageOut,
    PublicSessionOut,
)


def _available_spots(db: DBSession, session: Session) -> int:
    booked = (
        db.query(func.count())
        .select_from(booking_sessions_table)
        .join(Booking, Booking.id == booking_sessions_table.c.booking_id)
        .filter(
            booking_sessions_table.c.session_id == session.id,
            Booking.status != BookingStatus.REJECTED,
        )
        .scalar()
    )
    return max(0, session.capacity - booked)


def _to_public_session(db: DBSession, session: Session) -> PublicSessionOut:
    return PublicSessionOut(
        id=session.id,
        start_time=session.start_time,
        end_time=session.end_time,
        available_spots=_available_spots(db, session),
    )


def _future_scheduled(sessions) -> list[Session]:
    now = datetime.now(timezone.utc)
    return [
        s for s in sessions
        if s.status == SessionStatus.SCHEDULED and s.start_time > now
    ]


def list_public_event_types(db: DBSession, business_id: int) -> list[PublicEventTypeOut]:
    event_types = (
        db.query(EventType)
        .filter(
            EventType.business_id == business_id,
            EventType.is_active == True,  # noqa: E712
            EventType.visibility == EventTypeVisibility.PUBLIC.value,
        )
        .order_by(EventType.created_at)
        .all()
    )
    return [_build_event_type_out(db, et) for et in event_types]


def get_public_event_type(db: DBSession, business_id: int, event_type_id: int) -> PublicEventTypeOut | None:
    et = (
        db.query(EventType)
        .filter(
            EventType.id == event_type_id,
            EventType.business_id == business_id,
            EventType.is_active == True,  # noqa: E712
        )
        .first()
    )
    if et is None:
        return None
    return _build_event_type_out(db, et)


def _build_event_type_out(db: DBSession, et: EventType) -> PublicEventTypeOut:
    add_ons = [
        PublicAddOnOut(id=a.id, name=a.name, description=a.description, price=a.price)
        for a in et.add_ons
        if a.is_active
    ]

    package_out = None
    if et.package is not None:
        pkg = et.package
        future_pool = _future_scheduled(pkg.pool_sessions)
        pool_sessions = [_to_public_session(db, s) for s in future_pool]
        package_out = PublicPackageOut(
            date_mode=pkg.date_mode,
            required_session_count=pkg.required_session_count,
            pool_sessions=pool_sessions,
        )

    return PublicEventTypeOut(
        id=et.id,
        name=et.name,
        description=et.description,
        location=et.location,
        kind=et.kind,
        base_price=et.base_price,
        requires_payment=et.requires_payment,
        add_ons=add_ons,
        package=package_out,
    )


def list_available_sessions(db: DBSession, event_type_id: int) -> list[PublicSessionOut]:
    now = datetime.now(timezone.utc)
    sessions = (
        db.query(Session)
        .filter(
            Session.event_type_id == event_type_id,
            Session.status == SessionStatus.SCHEDULED,
            Session.start_time > now,
        )
        .order_by(Session.start_time)
        .all()
    )
    result = []
    for s in sessions:
        spots = _available_spots(db, s)
        if spots > 0:
            result.append(PublicSessionOut(
                id=s.id,
                start_time=s.start_time,
                end_time=s.end_time,
                available_spots=spots,
            ))
    return result
