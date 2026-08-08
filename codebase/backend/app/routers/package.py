from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Business
from app.routers.deps import get_current_business
from app.schemas.package import PackageCreate, PackageOut, PackagePoolAdd, PackageUpdate
from app.services.package import (
    add_session_to_pool,
    create_package,
    delete_package,
    get_package,
    list_packages,
    remove_session_from_pool,
    update_package,
)

router = APIRouter(prefix="/api/packages", tags=["packages"])


def _get_or_404(db: DBSession, business_id: int, package_id: int):
    pkg = get_package(db, business_id, package_id)
    if pkg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    return pkg


@router.post("", response_model=PackageOut, status_code=status.HTTP_201_CREATED)
def create(
    payload: PackageCreate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    try:
        return create_package(db, current_business.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[PackageOut])
def list_all(
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return list_packages(db, current_business.id)


@router.get("/{package_id}", response_model=PackageOut)
def get_one(
    package_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    return _get_or_404(db, current_business.id, package_id)


@router.patch("/{package_id}", response_model=PackageOut)
def patch(
    package_id: int,
    payload: PackageUpdate,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    pkg = _get_or_404(db, current_business.id, package_id)
    return update_package(db, pkg, payload)


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    package_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    pkg = _get_or_404(db, current_business.id, package_id)
    delete_package(db, pkg)


@router.post("/{package_id}/pool", response_model=PackageOut)
def add_to_pool(
    package_id: int,
    payload: PackagePoolAdd,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    pkg = _get_or_404(db, current_business.id, package_id)
    try:
        return add_session_to_pool(db, pkg, payload.session_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{package_id}/pool/{session_id}", response_model=PackageOut)
def remove_from_pool(
    package_id: int,
    session_id: int,
    db: DBSession = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    pkg = _get_or_404(db, current_business.id, package_id)
    try:
        return remove_session_from_pool(db, pkg, session_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
