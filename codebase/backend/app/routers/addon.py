from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.addon import AddOnCreate, AddOnOut, AddOnUpdate, EstimateOut, EstimateRequest
from app.services.addon import (
    calculate_estimate,
    create_addon,
    deactivate_addon,
    get_addon,
    list_addons,
    update_addon,
)

router = APIRouter(tags=["add-ons"])


def _get_or_404(db: DBSession, business_id: int, addon_id: int):
    addon = get_addon(db, business_id, addon_id)
    if addon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Add-on not found")
    return addon


# --- Admin endpoints ---

@router.post("/api/add-ons", response_model=AddOnOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: AddOnCreate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    try:
        return create_addon(db, current_business.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/api/add-ons", response_model=list[AddOnOut])
def list_all(
    event_type_id: int = Query(...),
    include_inactive: bool = Query(default=False),
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    try:
        return list_addons(db, current_business.id, event_type_id, include_inactive)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/api/add-ons/{addon_id}", response_model=AddOnOut)
def get_one(
    addon_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return _get_or_404(db, current_business.id, addon_id)


@router.patch("/api/add-ons/{addon_id}", response_model=AddOnOut)
def patch(
    addon_id: int,
    payload: AddOnUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    addon = _get_or_404(db, current_business.id, addon_id)
    return update_addon(db, addon, payload)


@router.delete("/api/add-ons/{addon_id}", response_model=AddOnOut)
def deactivate(
    addon_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    addon = _get_or_404(db, current_business.id, addon_id)
    return deactivate_addon(db, addon)


# --- Public endpoint (no auth — used by the booking widget) ---

@router.post("/api/estimate", response_model=EstimateOut)
def estimate(
    payload: EstimateRequest,
    db: DBSession = Depends(get_db),
):
    try:
        return calculate_estimate(db, payload.event_type_id, payload.addon_ids)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
