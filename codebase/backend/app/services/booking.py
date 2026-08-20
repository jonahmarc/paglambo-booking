from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.models import AddOn, Attendee, Booking, BookingStatus, Customer, EventType, EventTypeKind, Session
from app.models import booking_sessions as booking_sessions_table
from app.models.package import PackageDateMode
from app.models.session import SessionStatus
from app.schemas.booking import BookingCreate
from app.services.discount import apply_code, validate_code


def _find_or_create_customer(db: DBSession, business_id: int, customer_in) -> Customer:
    customer = (
        db.query(Customer)
        .filter(Customer.business_id == business_id, Customer.email == customer_in.email)
        .first()
    )
    if customer is None:
        customer = Customer(
            business_id=business_id,
            name=customer_in.name,
            email=customer_in.email,
            phone=customer_in.phone,
        )
        db.add(customer)
        db.flush()
    return customer


def _check_session_capacity(db: DBSession, session_id: int, capacity: int, party_size: int = 1) -> None:
    booked_count = (
        db.query(func.count())
        .select_from(booking_sessions_table)
        .join(Booking, Booking.id == booking_sessions_table.c.booking_id)
        .filter(
            booking_sessions_table.c.session_id == session_id,
            Booking.status != BookingStatus.REJECTED,
        )
        .scalar()
    )
    available = capacity - booked_count
    if available < party_size:
        if available <= 0:
            raise ValueError(f"Session {session_id} is fully booked")
        raise ValueError(
            f"Session {session_id} only has {available} spot(s) left — not enough for a party of {party_size}"
        )


def _resolve_sessions(db: DBSession, event_type: EventType, session_ids: list[int], party_size: int = 1) -> list[Session]:
    if event_type.kind == EventTypeKind.PACKAGE:
        package = event_type.package
        if package is None:
            raise ValueError("Package configuration not found for this event type")

        if package.date_mode == PackageDateMode.FIXED:
            sessions = list(package.pool_sessions)
            if not sessions:
                raise ValueError("Package has no sessions in its pool yet")
        else:
            if len(session_ids) != package.required_session_count:
                raise ValueError(
                    f"Must select exactly {package.required_session_count} session(s) for this package"
                )
            pool_map = {s.id: s for s in package.pool_sessions}
            sessions = []
            for sid in session_ids:
                session = pool_map.get(sid)
                if session is None:
                    raise ValueError(f"Session {sid} is not available in the package pool")
                if session.status != SessionStatus.SCHEDULED:
                    raise ValueError(f"Session {sid} is not available")
                sessions.append(session)
    else:
        if not session_ids:
            raise ValueError("At least one session must be selected")
        sessions = []
        for sid in session_ids:
            session = (
                db.query(Session)
                .filter(
                    Session.id == sid,
                    Session.event_type_id == event_type.id,
                    Session.status == SessionStatus.SCHEDULED,
                )
                .first()
            )
            if session is None:
                raise ValueError(f"Session {sid} not found or not available")
            sessions.append(session)

    for session in sessions:
        _check_session_capacity(db, session.id, session.capacity, party_size)

    return sessions


def _resolve_addons(db: DBSession, event_type_id: int, addon_ids: list[int]) -> list[AddOn]:
    addons = []
    for aid in addon_ids:
        addon = (
            db.query(AddOn)
            .filter(AddOn.id == aid, AddOn.event_type_id == event_type_id, AddOn.is_active == True)  # noqa: E712
            .first()
        )
        if addon is None:
            raise ValueError(f"Add-on {aid} not found or not available for this event type")
        addons.append(addon)
    return addons


def create_booking(db: DBSession, business_id: int, data: BookingCreate) -> Booking:
    event_type = (
        db.query(EventType)
        .filter(EventType.id == data.event_type_id, EventType.business_id == business_id, EventType.is_active == True)  # noqa: E712
        .first()
    )
    if event_type is None:
        raise ValueError("Event type not found")

    customer = _find_or_create_customer(db, business_id, data.customer)
    sessions = _resolve_sessions(db, event_type, data.session_ids, data.party_size)
    addons = _resolve_addons(db, event_type.id, data.addon_ids)

    subtotal = event_type.base_price * data.party_size + sum((a.price for a in addons), Decimal("0"))

    # Discount code
    discount_amount = Decimal("0")
    applied_code_str: str | None = None
    applied_code_obj = None
    if data.discount_code:
        result = validate_code(db, business_id, data.discount_code, subtotal)
        if not result.valid:
            raise ValueError(result.message or "Invalid discount code")
        discount_amount = result.discount_amount
        applied_code_str = result.code
        # Re-fetch the code object so we can increment use_count after commit
        from app.models.discount import DiscountCode
        applied_code_obj = (
            db.query(DiscountCode)
            .filter(DiscountCode.business_id == business_id, DiscountCode.code == result.code)
            .first()
        )

    total_price = subtotal - discount_amount

    booking = Booking(
        business_id=business_id,
        event_type_id=event_type.id,
        customer_id=customer.id,
        status=BookingStatus.PENDING,
        party_size=max(1, data.party_size),
        total_price=total_price,
        discount_code=applied_code_str,
        discount_amount=discount_amount if applied_code_str else None,
        notes=data.notes,
    )
    db.add(booking)
    db.flush()

    booking.sessions = sessions
    booking.add_ons = addons

    for att in data.attendees:
        db.add(Attendee(
            booking_id=booking.id,
            name=att.name,
            email=att.email,
            phone=att.phone,
            id_or_passport=att.id_or_passport,
            nationality=att.nationality,
            date_of_birth=att.date_of_birth,
            special_requirements=att.special_requirements,
        ))

    if not event_type.requires_payment:
        booking.status = BookingStatus.CONFIRMED

    if applied_code_obj:
        apply_code(db, applied_code_obj)

    db.commit()
    db.refresh(booking)
    return booking


def list_bookings(
    db: DBSession, business_id: int, status: BookingStatus | None = None
) -> list[Booking]:
    q = db.query(Booking).filter(Booking.business_id == business_id)
    if status is not None:
        q = q.filter(Booking.status == status)
    return q.order_by(Booking.created_at.desc()).all()


def get_booking(db: DBSession, business_id: int, booking_id: int) -> Booking | None:
    return (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.business_id == business_id)
        .first()
    )


# --- State transitions ---
# These are called by the receipt upload and payment review routers.

def transition_to_awaiting_payment(db: DBSession, booking: Booking) -> Booking:
    if booking.status != BookingStatus.PENDING:
        raise ValueError("Booking must be in PENDING state to move to awaiting_payment")
    booking.status = BookingStatus.AWAITING_PAYMENT
    db.commit()
    db.refresh(booking)
    return booking


def transition_to_confirmed(db: DBSession, booking: Booking) -> Booking:
    if booking.status != BookingStatus.AWAITING_PAYMENT:
        raise ValueError("Booking must be in AWAITING_PAYMENT state to confirm")
    booking.status = BookingStatus.CONFIRMED
    db.commit()
    db.refresh(booking)
    return booking


def transition_to_rejected(db: DBSession, booking: Booking) -> Booking:
    if booking.status != BookingStatus.AWAITING_PAYMENT:
        raise ValueError("Booking must be in AWAITING_PAYMENT state to reject")
    booking.status = BookingStatus.REJECTED
    db.commit()
    db.refresh(booking)
    return booking
