from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session as DBSession

from app.models.discount import DiscountCode, DiscountType
from app.schemas.discount import DiscountCodeCreate, DiscountCodeUpdate, DiscountValidateOut


def create_code(db: DBSession, business_id: int, data: DiscountCodeCreate) -> DiscountCode:
    code_upper = data.code.upper()
    exists = (
        db.query(DiscountCode)
        .filter(DiscountCode.business_id == business_id, DiscountCode.code == code_upper)
        .first()
    )
    if exists:
        raise ValueError(f"A discount code '{code_upper}' already exists")

    if data.type == DiscountType.PERCENTAGE and data.value > 100:
        raise ValueError("Percentage discount cannot exceed 100%")

    code = DiscountCode(
        business_id=business_id,
        code=code_upper,
        type=data.type,
        value=data.value,
        max_uses=data.max_uses,
        expires_at=data.expires_at,
    )
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


def list_codes(db: DBSession, business_id: int) -> list[DiscountCode]:
    return (
        db.query(DiscountCode)
        .filter(DiscountCode.business_id == business_id)
        .order_by(DiscountCode.created_at.desc())
        .all()
    )


def get_code(db: DBSession, business_id: int, code_id: int) -> DiscountCode | None:
    return (
        db.query(DiscountCode)
        .filter(DiscountCode.business_id == business_id, DiscountCode.id == code_id)
        .first()
    )


def update_code(db: DBSession, code: DiscountCode, data: DiscountCodeUpdate) -> DiscountCode:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(code, field, value)
    db.commit()
    db.refresh(code)
    return code


def _compute_discount(code: DiscountCode, subtotal: Decimal) -> Decimal:
    if code.type == DiscountType.FLAT:
        return min(code.value, subtotal)
    return (subtotal * code.value / Decimal("100")).quantize(Decimal("0.01"))


def validate_code(db: DBSession, business_id: int, code_str: str, subtotal: Decimal) -> DiscountValidateOut:
    code = (
        db.query(DiscountCode)
        .filter(
            DiscountCode.business_id == business_id,
            DiscountCode.code == code_str.strip().upper(),
        )
        .first()
    )
    if code is None:
        return DiscountValidateOut(valid=False, code=code_str, type=DiscountType.FLAT,
                                   discount_amount=Decimal("0"), message="Invalid discount code")
    if not code.is_active:
        return DiscountValidateOut(valid=False, code=code_str, type=code.type,
                                   discount_amount=Decimal("0"), message="This discount code is no longer active")
    if code.expires_at and code.expires_at < datetime.now(timezone.utc):
        return DiscountValidateOut(valid=False, code=code_str, type=code.type,
                                   discount_amount=Decimal("0"), message="This discount code has expired")
    if code.max_uses is not None and code.use_count >= code.max_uses:
        return DiscountValidateOut(valid=False, code=code_str, type=code.type,
                                   discount_amount=Decimal("0"), message="This discount code has reached its usage limit")

    discount_amount = _compute_discount(code, subtotal)
    return DiscountValidateOut(valid=True, code=code.code, type=code.type, discount_amount=discount_amount)


def apply_code(db: DBSession, code: DiscountCode) -> None:
    code.use_count += 1
    db.commit()
