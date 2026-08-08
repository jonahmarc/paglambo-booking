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
        logger.warning("RESEND_API_KEY not configured — skipping email '%s' to %s", subject, to)
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
