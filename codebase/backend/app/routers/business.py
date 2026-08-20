from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.business import BusinessDetail, BusinessUpdate
from app.services.business import update_business
from app.services.payment import save_qr_file

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


_QR_METHODS = {"paypal", "wise"}


@router.post("/qr/{method}", status_code=status.HTTP_204_NO_CONTENT)
async def upload_qr(
    method: str,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    if method not in _QR_METHODS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="method must be 'paypal' or 'wise'")
    try:
        file_path = await save_qr_file(current_business.id, method, file)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if method == "paypal":
        current_business.paypal_qr_path = file_path
    else:
        current_business.wise_qr_path = file_path
    db.commit()


@router.delete("/qr/{method}", status_code=status.HTTP_204_NO_CONTENT)
def delete_qr(
    method: str,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    if method not in _QR_METHODS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="method must be 'paypal' or 'wise'")
    path = current_business.paypal_qr_path if method == "paypal" else current_business.wise_qr_path
    if path:
        Path(path).unlink(missing_ok=True)
    if method == "paypal":
        current_business.paypal_qr_path = None
    else:
        current_business.wise_qr_path = None
    db.commit()
