"""Stripe billing (optional) + plan catalog."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select

from app.auth.deps import CurrentUser, ensure_user_org, get_current_user
from app.db.models import Subscription
from app.db.session import get_session
from app.services.access import perms_for, require_billing_admin
from app.services.entitlements import catalog

router = APIRouter(prefix="/api/v1/billing", tags=["saas-billing"])


class CheckoutBody(BaseModel):
    product: str  # cleaner | equity | tracker | closer | suite
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


def _stripe():
    key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if not key:
        return None
    try:
        import stripe  # type: ignore

        stripe.api_key = key
        return stripe
    except ImportError:
        return None


def _price_id(product: str) -> Optional[str]:
    env_map = {
        "cleaner": "STRIPE_PRICE_CLEANER",
        "equity": "STRIPE_PRICE_EQUITY",
        "tracker": "STRIPE_PRICE_TRACKER",
        "closer": "STRIPE_PRICE_CLOSER",
        "suite": "STRIPE_PRICE_SUITE",
    }
    env = env_map.get(product)
    if not env:
        return None
    return os.environ.get(env, "").strip() or None


def _plan_for_product(product: str) -> str:
    return {
        "cleaner": "cleaner",
        "equity": "equity",
        "tracker": "tracker",
        "closer": "closer",
        "suite": "suite",
    }.get(product, "trial")


@router.get("/catalog")
def billing_catalog() -> Dict[str, Any]:
    items = []
    for c in catalog():
        pid = _price_id(c["id"]) if c["id"] != "suite" or True else None
        items.append(
            {
                **{k: v for k, v in c.items() if k != "stripe_price_env"},
                "stripe_configured": bool(_price_id(c["id"])),
                "checkout_ready": bool(_stripe() and _price_id(c["id"])),
            }
        )
    return {
        "products": items,
        "stripe_enabled": bool(_stripe()),
        "note": (
            "When Stripe is not configured, org owners can still use trial/pilot plans; "
            "platform admin can grant paid plans manually."
        ),
    }


@router.get("/status")
def billing_status(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        sub = session.scalar(select(Subscription).where(Subscription.org_id == ctx.org.id))
        perms = perms_for(ctx.org, ctx.membership.role)
        return {
            "plan": ctx.org.plan,
            "suspended": bool(getattr(ctx.org, "suspended", False)),
            "permissions": perms,
            "subscription": (
                {
                    "status": sub.status,
                    "stripe_customer_id": sub.stripe_customer_id,
                    "stripe_subscription_id": sub.stripe_subscription_id,
                    "modules": sub.modules_json or [],
                }
                if sub
                else None
            ),
            "stripe_enabled": bool(_stripe()),
            "can_manage_billing": perms["can_manage_billing"],
        }


@router.post("/checkout")
def create_checkout(body: CheckoutBody, user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    stripe = _stripe()
    price = _price_id(body.product)
    if not stripe or not price:
        raise HTTPException(
            status_code=503,
            detail=(
                "Stripe checkout is not configured. Set STRIPE_SECRET_KEY and "
                f"price env for “{body.product}”, or ask platform admin to grant a plan."
            ),
        )
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_billing_admin(ctx.membership.role)
        sub = session.scalar(select(Subscription).where(Subscription.org_id == ctx.org.id))
        customer_id = sub.stripe_customer_id if sub else None
        if not customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"org_id": str(ctx.org.id), "org_slug": ctx.org.slug},
            )
            customer_id = customer["id"]
            if not sub:
                sub = Subscription(org_id=ctx.org.id, status="checkout")
                session.add(sub)
            sub.stripe_customer_id = customer_id
            session.flush()

        site = os.environ.get("PUBLIC_WEB_URL", "https://totalrewardsaccelerator.com").rstrip("/")
        success = body.success_url or f"{site}/app/billing?checkout=success"
        cancel = body.cancel_url or f"{site}/app/billing?checkout=cancel"
        session_obj = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": price, "quantity": 1}],
            success_url=success,
            cancel_url=cancel,
            metadata={
                "org_id": str(ctx.org.id),
                "product": body.product,
                "plan": _plan_for_product(body.product),
            },
            subscription_data={
                "metadata": {
                    "org_id": str(ctx.org.id),
                    "product": body.product,
                    "plan": _plan_for_product(body.product),
                }
            },
        )
        return {"url": session_obj["url"], "session_id": session_obj["id"]}


@router.post("/portal")
def customer_portal(user: CurrentUser = Depends(get_current_user)) -> Dict[str, Any]:
    stripe = _stripe()
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")
    with get_session() as session:
        ctx = ensure_user_org(session, user)
        require_billing_admin(ctx.membership.role)
        sub = session.scalar(select(Subscription).where(Subscription.org_id == ctx.org.id))
        if not sub or not sub.stripe_customer_id:
            raise HTTPException(status_code=400, detail="No Stripe customer for this org yet.")
        site = os.environ.get("PUBLIC_WEB_URL", "https://totalrewardsaccelerator.com").rstrip("/")
        portal = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=f"{site}/app/billing",
        )
        return {"url": portal["url"]}


@router.post("/webhook")
async def stripe_webhook(request: Request) -> Dict[str, Any]:
    stripe = _stripe()
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()
    if not stripe or not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook not configured")
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, secret)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Webhook error: {exc}") from exc

    etype = event["type"]
    data = event["data"]["object"]

    with get_session() as session:
        if etype == "checkout.session.completed":
            org_id = (data.get("metadata") or {}).get("org_id")
            plan = (data.get("metadata") or {}).get("plan") or "suite"
            product = (data.get("metadata") or {}).get("product")
            if org_id:
                from uuid import UUID

                from app.db.models import Organization

                org = session.get(Organization, UUID(org_id))
                if org:
                    org.plan = plan
                    sub = session.scalar(
                        select(Subscription).where(Subscription.org_id == org.id)
                    )
                    if not sub:
                        sub = Subscription(org_id=org.id)
                        session.add(sub)
                    sub.status = "active"
                    sub.stripe_customer_id = data.get("customer") or sub.stripe_customer_id
                    sub.stripe_subscription_id = data.get("subscription") or sub.stripe_subscription_id
                    if product == "suite":
                        sub.modules_json = ["cleaner", "equity", "tracker", "closer"]
                        org.entitlements_json = None
                    elif product:
                        sub.modules_json = [product]
                        org.entitlements_json = [product]
                        org.plan = product
        elif etype in (
            "customer.subscription.deleted",
            "customer.subscription.paused",
        ):
            sub_id = data.get("id")
            sub = session.scalar(
                select(Subscription).where(Subscription.stripe_subscription_id == sub_id)
            )
            if sub:
                sub.status = "canceled" if "deleted" in etype else "paused"
                from app.db.models import Organization

                org = session.get(Organization, sub.org_id)
                if org:
                    org.plan = "trial"
                    org.entitlements_json = None
        elif etype == "customer.subscription.updated":
            sub_id = data.get("id")
            status = data.get("status") or "active"
            sub = session.scalar(
                select(Subscription).where(Subscription.stripe_subscription_id == sub_id)
            )
            if sub:
                sub.status = status
                meta = data.get("metadata") or {}
                plan = meta.get("plan")
                product = meta.get("product")
                if plan or product:
                    from app.db.models import Organization

                    org = session.get(Organization, sub.org_id)
                    if org and status in ("active", "trialing"):
                        if plan:
                            org.plan = plan
                        if product == "suite":
                            org.entitlements_json = None
                            sub.modules_json = ["cleaner", "equity", "tracker", "closer"]
                        elif product:
                            org.plan = product
                            org.entitlements_json = [product]
                            sub.modules_json = [product]
                if status in ("canceled", "unpaid", "incomplete_expired"):
                    from app.db.models import Organization

                    org = session.get(Organization, sub.org_id)
                    if org:
                        org.plan = "trial"
                        org.entitlements_json = None
    return {"received": True}
