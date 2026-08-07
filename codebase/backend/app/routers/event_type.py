from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.event_type import EventTypeCreate, EventTypeOut, EventTypeUpdate
from app.services.event_type import (
    create_event_type,
    deactivate_event_type,
    get_event_type,
    list_event_types,
    update_event_type,
)

router = APIRouter(prefix="/api/event-types", tags=["event-types"])


def _get_or_404(db: DBSession, business_id: int, event_type_id: int):
    et = get_event_type(db, business_id, event_type_id)
    if et is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    return et


@router.post("", response_model=EventTypeOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: EventTypeCreate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return create_event_type(db, current_business.id, payload)


@router.get("", response_model=list[EventTypeOut])
def list_all(
    include_inactive: bool = Query(default=False),
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return list_event_types(db, current_business.id, include_inactive)


@router.get("/{event_type_id}", response_model=EventTypeOut)
def get_one(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return _get_or_404(db, current_business.id, event_type_id)


@router.patch("/{event_type_id}", response_model=EventTypeOut)
def patch(
    event_type_id: int,
    payload: EventTypeUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    et = _get_or_404(db, current_business.id, event_type_id)
    return update_event_type(db, et, payload)


@router.delete("/{event_type_id}", response_model=EventTypeOut)
def deactivate(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    et = _get_or_404(db, current_business.id, event_type_id)
    return deactivate_event_type(db, et)
