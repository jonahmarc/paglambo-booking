from decimal import Decimal

from sqlalchemy.orm import Session as DBSession

from app.models import AddOn, EventType
from app.schemas.addon import AddOnCreate, AddOnUpdate, EstimateLineItem, EstimateOut


def create_addon(db: DBSession, business_id: int, data: AddOnCreate) -> AddOn:
    event_type = (
        db.query(EventType)
        .filter(EventType.id == data.event_type_id, EventType.business_id == business_id)
        .first()
    )
    if event_type is None:
        raise ValueError("Event type not found")

    addon = AddOn(
        event_type_id=data.event_type_id,
        name=data.name,
        description=data.description,
        price=data.price,
    )
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return addon


def list_addons(db: DBSession, business_id: int, event_type_id: int, include_inactive: bool = False) -> list[AddOn]:
    event_type = (
        db.query(EventType)
        .filter(EventType.id == event_type_id, EventType.business_id == business_id)
        .first()
    )
    if event_type is None:
        raise ValueError("Event type not found")

    q = db.query(AddOn).filter(AddOn.event_type_id == event_type_id)
    if not include_inactive:
        q = q.filter(AddOn.is_active == True)  # noqa: E712
    return q.order_by(AddOn.created_at).all()


def get_addon(db: DBSession, business_id: int, addon_id: int) -> AddOn | None:
    return (
        db.query(AddOn)
        .join(EventType)
        .filter(AddOn.id == addon_id, EventType.business_id == business_id)
        .first()
    )


def update_addon(db: DBSession, addon: AddOn, data: AddOnUpdate) -> AddOn:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(addon, field, value)
    db.commit()
    db.refresh(addon)
    return addon


def deactivate_addon(db: DBSession, addon: AddOn) -> AddOn:
    addon.is_active = False
    db.commit()
    db.refresh(addon)
    return addon


def calculate_estimate(db: DBSession, event_type_id: int, addon_ids: list[int]) -> EstimateOut:
    event_type = db.query(EventType).filter(EventType.id == event_type_id, EventType.is_active == True).first()  # noqa: E712
    if event_type is None:
        raise ValueError("Event type not found")

    selected: list[EstimateLineItem] = []
    for addon_id in addon_ids:
        addon = (
            db.query(AddOn)
            .filter(AddOn.id == addon_id, AddOn.event_type_id == event_type_id, AddOn.is_active == True)  # noqa: E712
            .first()
        )
        if addon is None:
            raise ValueError(f"Add-on {addon_id} not found or not available for this event type")
        selected.append(EstimateLineItem(id=addon.id, name=addon.name, price=addon.price))

    total = event_type.base_price + sum((item.price for item in selected), Decimal("0"))
    return EstimateOut(base_price=event_type.base_price, add_ons=selected, total=total)
