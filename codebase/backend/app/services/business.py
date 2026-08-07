from sqlalchemy.orm import Session as DBSession

from app.models import Business
from app.schemas.business import BusinessUpdate


def update_business(db: DBSession, business: Business, data: BusinessUpdate) -> Business:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return business
