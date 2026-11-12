"""Flutterwave Standard integration.

The shopper is sent to Flutterwave's hosted checkout (card, bank transfer,
USSD, mobile money) and comes back to the storefront. An order is only marked
paid after the transaction is re-fetched from Flutterwave's API and its
reference, amount and currency match the order — the redirect query string
alone is never trusted.
"""

import hmac
import json
import logging
import urllib.error
import urllib.request
from decimal import Decimal

from django.conf import settings

logger = logging.getLogger(__name__)


class PaymentError(Exception):
    pass


def online_payments_enabled():
    return bool(settings.FLUTTERWAVE_SECRET_KEY)


def _request(method, path, payload=None):
    req = urllib.request.Request(
        f"{settings.FLUTTERWAVE_API_URL}{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            body = json.loads(res.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        logger.warning("Flutterwave %s %s failed: %s %s", method, path, exc.code, detail)
        raise PaymentError("The payment provider rejected the request.") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("Flutterwave %s %s unreachable: %s", method, path, exc)
        raise PaymentError("The payment provider is unreachable. Please try again.") from exc
    if body.get("status") != "success":
        raise PaymentError(body.get("message") or "The payment provider returned an error.")
    return body.get("data") or {}


def create_payment_link(order):
    """Returns the hosted-checkout URL for an order awaiting payment."""
    item_names = ", ".join(f"{i.quantity}× {i.product_name}" for i in order.items.all())
    payload = {
        "tx_ref": order.order_number,
        "amount": str(order.total),
        "currency": settings.PAYMENT_CURRENCY,
        "redirect_url": f"{settings.FRONTEND_URL}/checkout/success?order={order.order_number}",
        "payment_options": "card, banktransfer, ussd, mobilemoney",
        "customer": {
            "email": order.email,
            "name": f"{order.first_name} {order.last_name}".strip(),
            "phonenumber": order.phone,
        },
        "customizations": {
            "title": "GlowByYou",
            "description": item_names[:200],
            **({"logo": settings.STORE_LOGO_URL} if settings.STORE_LOGO_URL else {}),
        },
        "meta": {"order_number": order.order_number},
    }
    link = _request("POST", "/payments", payload).get("link")
    if not link:
        raise PaymentError("The payment provider did not return a checkout link.")
    return link


def verify_transaction(transaction_id, order):
    """Fetches a transaction and returns it only if it fully pays this order."""
    tx = _request("GET", f"/transactions/{int(transaction_id)}/verify")
    paid = (
        tx.get("status") == "successful"
        and tx.get("tx_ref") == order.order_number
        and str(tx.get("currency", "")).upper() == settings.PAYMENT_CURRENCY
        and Decimal(str(tx.get("amount", 0))) >= order.total
    )
    if not paid:
        logger.warning("Transaction %s does not settle order %s: %s", transaction_id, order.order_number, tx.get("status"))
        return None
    return tx


def valid_webhook_signature(header_value):
    secret = settings.FLUTTERWAVE_SECRET_HASH
    return bool(secret) and hmac.compare_digest(str(header_value or ""), secret)
