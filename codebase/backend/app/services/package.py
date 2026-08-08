from sqlalchemy.orm import Session as DBSession

from app.models import EventType, EventTypeKind, Package, Session
from app.schemas.package import PackageCreate, PackageUpdate


def create_package(db: DBSession, business_id: int, data: PackageCreate) -> Package:
    event_type = (
        db.query(EventType)
        .filter(EventType.id == data.event_type_id, EventType.business_id == business_id)
        .first()
    )
    if event_type is None:
        raise ValueError("Event type not found")
    if event_type.kind != EventTypeKind.PACKAGE:
        raise ValueError("Event type must have kind 'package'")
    if event_type.package is not None:
        raise ValueError("A package already exists for this event type")

    package = Package(
        event_type_id=data.event_type_id,
        date_mode=data.date_mode,
        required_session_count=data.required_session_count,
    )
    db.add(package)
    db.commit()
    db.refresh(package)
    return package


def list_packages(db: DBSession, business_id: int) -> list[Package]:
    return (
        db.query(Package)
        .join(EventType)
        .filter(EventType.business_id == business_id)
        .order_by(Package.created_at)
        .all()
    )


def get_package(db: DBSession, business_id: int, package_id: int) -> Package | None:
    return (
        db.query(Package)
        .join(EventType)
        .filter(Package.id == package_id, EventType.business_id == business_id)
        .first()
    )


def update_package(db: DBSession, package: Package, data: PackageUpdate) -> Package:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(package, field, value)
    db.commit()
    db.refresh(package)
    return package


def delete_package(db: DBSession, package: Package) -> None:
    db.delete(package)
    db.commit()


def add_session_to_pool(db: DBSession, package: Package, session_id: int) -> Package:
    session = (
        db.query(Session)
        .filter(Session.id == session_id, Session.event_type_id == package.event_type_id)
        .first()
    )
    if session is None:
        raise ValueError("Session not found or does not belong to this package's event type")
    if session in package.pool_sessions:
        raise ValueError("Session is already in the pool")

    package.pool_sessions.append(session)
    db.commit()
    db.refresh(package)
    return package


def remove_session_from_pool(db: DBSession, package: Package, session_id: int) -> Package:
    session = next((s for s in package.pool_sessions if s.id == session_id), None)
    if session is None:
        raise ValueError("Session not found in pool")

    package.pool_sessions.remove(session)
    db.commit()
    db.refresh(package)
    return package
