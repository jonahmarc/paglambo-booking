from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.models.event_type_photo import EventTypePhoto

PHOTO_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
PHOTO_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_photo_file(event_type_id: int, photo_id: int, file: UploadFile) -> str:
    if file.content_type not in PHOTO_ALLOWED_TYPES:
        raise ValueError("Invalid file type. Accepted: JPEG, PNG, WEBP")
    content = await file.read()
    if len(content) > PHOTO_MAX_SIZE:
        raise ValueError("File is too large. Maximum size is 10 MB")

    upload_dir = Path(settings.upload_dir) / "photos"
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "photo").suffix.lower() or ".jpg"
    dest = upload_dir / f"{event_type_id}_{photo_id}{suffix}"
    with dest.open("wb") as f:
        f.write(content)

    return str(dest)


def list_photos(db: DBSession, event_type_id: int) -> list[EventTypePhoto]:
    return (
        db.query(EventTypePhoto)
        .filter(EventTypePhoto.event_type_id == event_type_id)
        .order_by(EventTypePhoto.sort_order)
        .all()
    )


def get_photo(db: DBSession, event_type_id: int, photo_id: int) -> EventTypePhoto | None:
    return (
        db.query(EventTypePhoto)
        .filter(
            EventTypePhoto.id == photo_id,
            EventTypePhoto.event_type_id == event_type_id,
        )
        .first()
    )


def create_photo(db: DBSession, event_type_id: int) -> EventTypePhoto:
    next_order = (
        db.query(EventTypePhoto)
        .filter(EventTypePhoto.event_type_id == event_type_id)
        .count()
    )
    photo = EventTypePhoto(event_type_id=event_type_id, file_path="", sort_order=next_order)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def set_photo_path(db: DBSession, photo: EventTypePhoto, file_path: str) -> EventTypePhoto:
    photo.file_path = file_path
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: DBSession, photo: EventTypePhoto) -> None:
    Path(photo.file_path).unlink(missing_ok=True)
    db.delete(photo)
    db.commit()


def update_sort_order(db: DBSession, photo: EventTypePhoto, new_order: int) -> EventTypePhoto:
    photo.sort_order = new_order
    db.commit()
    db.refresh(photo)
    return photo
