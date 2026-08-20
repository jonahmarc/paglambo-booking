from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.business import BusinessDetail, BusinessUpdate
from app.services.business import update_business

router = APIRouter(prefix="/api/business", tags=["business"])


@router.get("", response_model=BusinessDetail)
def get_business(current_business: Business = Depends(get_current_business)):
    return current_business


@router.patch("", response_model=BusinessDetail)
def patch_business(
    payload: BusinessUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    try:
        return update_business(db, current_business, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
