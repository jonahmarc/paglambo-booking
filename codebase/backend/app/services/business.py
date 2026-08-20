from sqlalchemy.orm import Session as DBSession

from app.models import Business
from app.schemas.business import BusinessUpdate


def update_business(db: DBSession, business: Business, data: BusinessUpdate) -> Business:
    updates = data.model_dump(exclude_unset=True)

    if 'slug' in updates and updates['slug'] is not None:
        conflict = (
            db.query(Business)
            .filter(Business.slug == updates['slug'], Business.id != business.id)
            .first()
        )
        if conflict:
            raise ValueError(f"The URL '{updates['slug']}' is already taken. Please choose a different one.")

    for field, value in updates.items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return business
