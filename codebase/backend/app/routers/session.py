from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, SessionStatus
from app.routers.deps import get_current_business
from app.schemas.booking import BookingOut
from app.schemas.session import SessionCreate, SessionGenerateRequest, SessionOut, SessionUpdate
from app.services.event_type import get_event_type
from app.services.session import (
    cancel_session,
    create_session,
    generate_sessions,
    get_booked_counts,
    get_session,
    get_session_bookings,
    list_sessions,
    reactivate_session,
    sync_sessions_to_pool,
    update_session,
)

router = APIRouter(prefix="/api/event-types/{event_type_id}/sessions", tags=["sessions"])


def _get_event_type_or_404(db: DBSession, business_id: int, event_type_id: int):
    et = get_event_type(db, business_id, event_type_id)
    if et is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    return et


def _get_session_or_404(db: DBSession, event_type_id: int, session_id: int):
    s = get_session(db, event_type_id, session_id)
    if s is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return s


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create(
    event_type_id: int,
    payload: SessionCreate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    et = _get_event_type_or_404(db, current_business.id, event_type_id)
    session = create_session(db, event_type_id, payload)
    if et.package is not None:
        et.package.pool_sessions.append(session)
        db.commit()
    return session


@router.post("/generate", response_model=list[SessionOut], status_code=status.HTTP_201_CREATED)
def generate(
    event_type_id: int,
    payload: SessionGenerateRequest,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    et = _get_event_type_or_404(db, current_business.id, event_type_id)
    try:
        sessions = generate_sessions(db, event_type_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    if et.package is not None:
        for s in sessions:
            et.package.pool_sessions.append(s)
        db.commit()
    return sessions


@router.post("/sync-pool", status_code=status.HTTP_204_NO_CONTENT)
def sync_pool(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    sync_sessions_to_pool(db, event_type_id)


@router.get("", response_model=list[SessionOut])
def list_all(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    sessions = list_sessions(db, event_type_id)
    booked = get_booked_counts(db, [s.id for s in sessions])
    return [
        SessionOut.model_validate(s).model_copy(update={"booked_count": booked.get(s.id, 0)})
        for s in sessions
    ]


@router.get("/{session_id}/bookings", response_model=list[BookingOut])
def list_session_bookings(
    event_type_id: int,
    session_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    _get_session_or_404(db, event_type_id, session_id)
    return get_session_bookings(db, session_id)


@router.get("/{session_id}", response_model=SessionOut)
def get_one(
    event_type_id: int,
    session_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    return _get_session_or_404(db, event_type_id, session_id)


@router.patch("/{session_id}", response_model=SessionOut)
def patch(
    event_type_id: int,
    session_id: int,
    payload: SessionUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    s = _get_session_or_404(db, event_type_id, session_id)
    return update_session(db, s, payload)


@router.delete("/{session_id}", response_model=SessionOut)
def cancel(
    event_type_id: int,
    session_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    s = _get_session_or_404(db, event_type_id, session_id)
    return cancel_session(db, s)


@router.post("/{session_id}/reactivate", response_model=SessionOut)
def reactivate(
    event_type_id: int,
    session_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    s = _get_session_or_404(db, event_type_id, session_id)
    if s.status != SessionStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not cancelled")
    return reactivate_session(db, s)
