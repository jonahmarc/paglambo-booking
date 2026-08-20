from decimal import Decimal

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_business_or_404, get_current_business
from app.schemas.discount import DiscountCodeCreate, DiscountCodeOut, DiscountCodeUpdate, DiscountValidateOut
from app.services.discount import create_code, get_code, list_codes, update_code, validate_code

router = APIRouter(tags=["discount-codes"])


def _get_or_404(db: DBSession, business_id: int, code_id: int):
    code = get_code(db, business_id, code_id)
    if code is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount code not found")
    return code


# --- Admin endpoints ---

@router.post("/api/discount-codes", response_model=DiscountCodeOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: DiscountCodeCreate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    try:
        return create_code(db, current_business.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/api/discount-codes", response_model=list[DiscountCodeOut])
def list_all(
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return list_codes(db, current_business.id)


@router.get("/api/discount-codes/{code_id}", response_model=DiscountCodeOut)
def get_one(
    code_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return _get_or_404(db, current_business.id, code_id)


@router.patch("/api/discount-codes/{code_id}", response_model=DiscountCodeOut)
def patch(
    code_id: int,
    payload: DiscountCodeUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    code = _get_or_404(db, current_business.id, code_id)
    return update_code(db, code, payload)


# --- Public endpoint ---

@router.post("/api/public/{booking_key}/discount-codes/validate", response_model=DiscountValidateOut)
def validate(
    booking_key: str,
    code: str = Body(..., embed=True),
    subtotal: Decimal = Body(..., embed=True),
    db: DBSession = Depends(get_db),
):
    business = get_business_or_404(db, booking_key)
    return validate_code(db, business.id, code, subtotal)
