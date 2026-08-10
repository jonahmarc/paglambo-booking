import logging

import resend

from app.config import settings

logger = logging.getLogger(__name__)

_FALLBACK_FROM = "Buhata Booking <onboarding@resend.dev>"


def _from_address() -> str:
    if settings.resend_from_email:
        return f"Buhata Booking <{settings.resend_from_email}>"
    return _FALLBACK_FROM


def _send(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        logger.info("No RESEND_API_KEY — skipping email '%s' to %s", subject, to)
        return

    # Without a verified sending domain we are in Resend sandbox mode.
    # Sandbox only allows delivery to the account's own email address.
    # Redirect to RESEND_TEST_TO if set; otherwise skip rather than error.
    if not settings.resend_from_email:
        if settings.resend_test_to:
            logger.info("Sandbox mode — redirecting email '%s' from %s to %s", subject, to, settings.resend_test_to)
            to = settings.resend_test_to
        else:
            logger.info("No RESEND_FROM_EMAIL or RESEND_TEST_TO — skipping email '%s' to %s", subject, to)
            return

    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send({
            "from": _from_address(),
            "to": [to],
            "subject": subject,
            "html": html,
        })
    except Exception:
        logger.exception("Failed to send email '%s' to %s", subject, to)


def _session_list_html(sessions) -> str:
    if not sessions:
        return ""
    items = "".join(
        f"<li>{s.start_time.strftime('%A, %d %b %Y at %H:%M')} UTC</li>"
        for s in sessions
    )
    return f"<p><strong>Sessions:</strong></p><ul>{items}</ul>"


# --- Outbound notifications ---

def send_receipt_received(booking, business) -> None:
    """Notify the admin that a customer has uploaded a payment receipt."""
    method = booking.payment.method.value if booking.payment else "—"
    amount = booking.payment.amount if booking.payment else "—"
    html = f"""
    <p>Hi,</p>
    <p>A payment receipt has been submitted and is waiting for your review.</p>
    <table cellpadding="6" cellspacing="0">
      <tr><td><strong>Booking&nbsp;#</strong></td><td>{booking.id}</td></tr>
      <tr><td><strong>Customer</strong></td><td>{booking.customer.name} ({booking.customer.email})</td></tr>
      <tr><td><strong>Event</strong></td><td>{booking.event_type.name}</td></tr>
      <tr><td><strong>Method</strong></td><td>{method}</td></tr>
      <tr><td><strong>Amount&nbsp;paid</strong></td><td>{amount}</td></tr>
      <tr><td><strong>Booking&nbsp;total</strong></td><td>{booking.total_price}</td></tr>
    </table>
    <p>Log in to the admin dashboard to view the receipt and approve or reject the payment.</p>
    """
    _send(business.email, f"Receipt uploaded — Booking #{booking.id}", html)


def send_booking_confirmed(booking) -> None:
    """Notify the customer that their booking is confirmed."""
    html = f"""
    <p>Hi {booking.customer.name},</p>
    <p>Your payment has been verified and your booking is <strong>confirmed</strong>!</p>
    <table cellpadding="6" cellspacing="0">
      <tr><td><strong>Booking&nbsp;#</strong></td><td>{booking.id}</td></tr>
      <tr><td><strong>Event</strong></td><td>{booking.event_type.name}</td></tr>
      <tr><td><strong>Total&nbsp;paid</strong></td><td>{booking.total_price}</td></tr>
    </table>
    {_session_list_html(booking.sessions)}
    <p>We look forward to seeing you!</p>
    """
    _send(
        booking.customer.email,
        f"Booking confirmed — {booking.event_type.name}",
        html,
    )


def send_payment_approved(booking) -> None:
    """Alias kept for clarity — same email as booking confirmed."""
    send_booking_confirmed(booking)


def send_new_registration(business, superadmin_email: str) -> None:
    """Notify superadmin that a new business has registered and is awaiting approval."""
    html = f"""
    <p>Hi,</p>
    <p>A new business has registered on Buhata Booking and is awaiting your approval.</p>
    <table cellpadding="6" cellspacing="0">
      <tr><td><strong>Business</strong></td><td>{business.name}</td></tr>
      <tr><td><strong>Email</strong></td><td>{business.email}</td></tr>
      <tr><td><strong>Plan</strong></td><td>{business.plan.title()}</td></tr>
    </table>
    <p>Log in to the superadmin dashboard to approve or reject this registration.</p>
    """
    _send(superadmin_email, f"New registration — {business.name}", html)


def send_registration_approved(business) -> None:
    """Notify business their registration was approved and trial has started."""
    end_date = business.trial_ends_at.strftime("%d %b %Y") if business.trial_ends_at else "—"
    html = f"""
    <p>Hi {business.name},</p>
    <p>Your Buhata Booking registration has been approved!</p>
    <p>Your <strong>{business.plan.title()}</strong> plan trial is active until <strong>{end_date}</strong>.</p>
    <p>Log in to your dashboard to set up your booking page.</p>
    """
    _send(business.email, "Registration approved — Buhata Booking", html)


def send_registration_rejected(business, note: str | None = None) -> None:
    """Notify business their registration was rejected."""
    note_row = f"<p><strong>Reason:</strong> {note}</p>" if note else ""
    html = f"""
    <p>Hi {business.name},</p>
    <p>Unfortunately we were unable to approve your Buhata Booking registration at this time.</p>
    {note_row}
    <p>Please contact us if you have any questions.</p>
    """
    _send(business.email, "Registration not approved — Buhata Booking", html)


def send_subscription_receipt_received(business, superadmin_email: str) -> None:
    """Notify superadmin that a business uploaded a subscription payment receipt."""
    html = f"""
    <p>Hi,</p>
    <p>A subscription payment receipt has been submitted and is waiting for your review.</p>
    <table cellpadding="6" cellspacing="0">
      <tr><td><strong>Business</strong></td><td>{business.name} ({business.email})</td></tr>
      <tr><td><strong>Plan</strong></td><td>{business.plan.title()}</td></tr>
    </table>
    <p>Log in to the superadmin dashboard to approve or reject the payment.</p>
    """
    _send(superadmin_email, f"Subscription receipt — {business.name}", html)


def send_subscription_approved(business) -> None:
    """Notify business that their subscription payment was approved."""
    html = f"""
    <p>Hi {business.name},</p>
    <p>Your subscription payment has been verified. Your Buhata Booking
    <strong>{business.plan.title()}</strong> plan is now active.</p>
    <p>Log in to your dashboard to continue using the platform.</p>
    """
    _send(business.email, "Subscription activated — Buhata Booking", html)


def send_subscription_rejected(business, note: str | None = None) -> None:
    """Notify business that their subscription payment was rejected."""
    note_row = f"<p><strong>Reason:</strong> {note}</p>" if note else ""
    html = f"""
    <p>Hi {business.name},</p>
    <p>Unfortunately we could not verify your subscription payment for Buhata Booking.</p>
    {note_row}
    <p>Please upload a new receipt from your dashboard or contact us if you believe this is an error.</p>
    """
    _send(business.email, "Subscription payment not verified — Buhata Booking", html)


def send_trial_expiry_reminder(business, days_left: int) -> None:
    """Remind a business their trial is expiring soon."""
    plural = "s" if days_left != 1 else ""
    html = f"""
    <p>Hi {business.name},</p>
    <p>Your Buhata Booking trial expires in <strong>{days_left} day{plural}</strong>.</p>
    <p>To keep your booking page active, log in and upload a subscription payment receipt.</p>
    """
    _send(business.email, f"Your trial expires in {days_left} day{plural} — Buhata Booking", html)


def send_trial_expired(business) -> None:
    """Notify a business their trial has expired and their booking page is inactive."""
    html = f"""
    <p>Hi {business.name},</p>
    <p>Your Buhata Booking trial has expired. Your booking page is currently inactive.</p>
    <p>To reactivate, log in to your dashboard and upload a subscription payment receipt.</p>
    """
    _send(business.email, "Trial expired — Buhata Booking", html)


def send_payment_rejected(booking) -> None:
    """Notify the customer that their payment could not be verified."""
    note_row = ""
    if booking.payment and booking.payment.review_note:
        note_row = f"<tr><td><strong>Reason</strong></td><td>{booking.payment.review_note}</td></tr>"
    html = f"""
    <p>Hi {booking.customer.name},</p>
    <p>Unfortunately we were unable to verify your payment for the booking below.</p>
    <table cellpadding="6" cellspacing="0">
      <tr><td><strong>Booking&nbsp;#</strong></td><td>{booking.id}</td></tr>
      <tr><td><strong>Event</strong></td><td>{booking.event_type.name}</td></tr>
      {note_row}
    </table>
    <p>If you believe this is an error, or to submit a new receipt, please contact us directly.</p>
    """
    _send(
        booking.customer.email,
        f"Payment not verified — {booking.event_type.name}",
        html,
    )
