from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session as DBSession

from app.models.session import Session as SessionModel, SessionStatus
from app.schemas.session import SessionCreate, SessionGenerateRequest, SessionUpdate


def create_session(db: DBSession, event_type_id: int, data: SessionCreate) -> SessionModel:
    session = SessionModel(
        event_type_id=event_type_id,
        start_time=data.start_time,
        end_time=data.end_time,
        capacity=data.capacity,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def generate_sessions(db: DBSession, event_type_id: int, data: SessionGenerateRequest) -> list[SessionModel]:
    try:
        tz = ZoneInfo(data.timezone)
    except ZoneInfoNotFoundError:
        raise ValueError(f"Unknown timezone: {data.timezone}")

    if data.start_date > data.end_date:
        raise ValueError("start_date must be on or before end_date")

    days_set = set(data.days_of_week)
    created: list[SessionModel] = []
    current = data.start_date

    while current <= data.end_date:
        if current.weekday() in days_set:
            local_start = datetime(
                current.year, current.month, current.day,
                data.start_time.hour, data.start_time.minute, data.start_time.second,
                tzinfo=tz,
            )
            local_end = local_start + timedelta(minutes=data.duration_minutes) if data.duration_minutes else None
            session = SessionModel(
                event_type_id=event_type_id,
                start_time=local_start,
                end_time=local_end,
                capacity=data.capacity,
            )
            db.add(session)
            created.append(session)
        current += timedelta(days=1)

    db.commit()
    for s in created:
        db.refresh(s)
    return created


def list_sessions(db: DBSession, event_type_id: int) -> list[SessionModel]:
    return (
        db.query(SessionModel)
        .filter(SessionModel.event_type_id == event_type_id)
        .order_by(SessionModel.start_time)
        .all()
    )


def get_session(db: DBSession, event_type_id: int, session_id: int) -> SessionModel | None:
    return (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.event_type_id == event_type_id)
        .first()
    )


def update_session(db: DBSession, session: SessionModel, data: SessionUpdate) -> SessionModel:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


def cancel_session(db: DBSession, session: SessionModel) -> SessionModel:
    session.status = SessionStatus.CANCELLED
    db.commit()
    db.refresh(session)
    return session


def reactivate_session(db: DBSession, session: SessionModel) -> SessionModel:
    session.status = SessionStatus.SCHEDULED
    db.commit()
    db.refresh(session)
    return session
