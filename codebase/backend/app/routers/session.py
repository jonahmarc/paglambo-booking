from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business, SessionStatus
from app.routers.deps import get_current_business
from app.schemas.session import SessionCreate, SessionGenerateRequest, SessionOut, SessionUpdate
from app.services.event_type import get_event_type
from app.services.session import (
    cancel_session,
    create_session,
    generate_sessions,
    get_session,
    list_sessions,
    reactivate_session,
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
    _get_event_type_or_404(db, current_business.id, event_type_id)
    return create_session(db, event_type_id, payload)


@router.post("/generate", response_model=list[SessionOut], status_code=status.HTTP_201_CREATED)
def generate(
    event_type_id: int,
    payload: SessionGenerateRequest,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    try:
        return generate_sessions(db, event_type_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("", response_model=list[SessionOut])
def list_all(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_event_type_or_404(db, current_business.id, event_type_id)
    return list_sessions(db, event_type_id)


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
