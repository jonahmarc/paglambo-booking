from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.event_type import EventTypeCreate, EventTypeOut, EventTypeUpdate
from app.services.event_type import (
    create_event_type,
    deactivate_event_type,
    delete_event_type_hard,
    get_event_type,
    list_event_types,
    update_event_type,
)
from app.services.event_type_photo import (
    create_photo,
    delete_photo,
    get_photo,
    list_photos,
    save_photo_file,
    set_photo_path,
    update_sort_order,
)


class PhotoOut(BaseModel):
    id: int
    sort_order: int

    model_config = {"from_attributes": True}


class PhotoOrderUpdate(BaseModel):
    sort_order: int

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


@router.delete("/{event_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    et = _get_or_404(db, current_business.id, event_type_id)
    try:
        delete_event_type_hard(db, et)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ── Photos ────────────────────────────────────────────────────────────────────

@router.get("/{event_type_id}/photos", response_model=list[PhotoOut])
def list_event_photos(
    event_type_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_or_404(db, current_business.id, event_type_id)
    return list_photos(db, event_type_id)


@router.post("/{event_type_id}/photos", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    event_type_id: int,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_or_404(db, current_business.id, event_type_id)
    photo = create_photo(db, event_type_id)
    try:
        file_path = await save_photo_file(event_type_id, photo.id, file)
    except ValueError as e:
        delete_photo(db, photo)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return set_photo_path(db, photo, file_path)


@router.delete("/{event_type_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_photo(
    event_type_id: int,
    photo_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_or_404(db, current_business.id, event_type_id)
    photo = get_photo(db, event_type_id, photo_id)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    delete_photo(db, photo)


@router.patch("/{event_type_id}/photos/{photo_id}", response_model=PhotoOut)
def reorder_photo(
    event_type_id: int,
    photo_id: int,
    payload: PhotoOrderUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    _get_or_404(db, current_business.id, event_type_id)
    photo = get_photo(db, event_type_id, photo_id)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    return update_sort_order(db, photo, payload.sort_order)
