"""A seat is a license with a window. Customers do not mint one."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

TRIAL_DAYS = 30

CUSTOMER_SEAT_CLOSED = (
    "A seat is issued from the platform. A license has to be open first, "
    "and it has a start and an end."
)
PASSAGE_WITHOUT_LICENSE = "This passage is not backed by a license."
LICENSE_NOT_OPEN = "This license is not open."
LICENSE_OUTSIDE = "This license is outside its window."
TRIAL_ENDED = "This trial window has ended."


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def seat_window_open(starts_at: datetime, ends_at: datetime, now: datetime) -> bool:
    """True only inside [start, end). A missing edge is closed."""
    if starts_at is None or ends_at is None:
        return False
    start = as_utc(starts_at)
    end = as_utc(ends_at)
    moment = as_utc(now)
    return start <= moment < end


def license_is_open(
    starts_at: datetime,
    ends_at: datetime,
    membership_id: Optional[object],
    now: datetime,
) -> bool:
    """An open license has no person on it yet and the clock is inside the window."""
    if membership_id is not None:
        return False
    return seat_window_open(starts_at, ends_at, now)


def trial_passage_open(plan: Optional[str], access_until: Optional[datetime], now: datetime) -> bool:
    """A paid plan is not on the trial clock. An unmarked trial stays as it was."""
    if (plan or "").strip().lower() != "trial":
        return True
    if access_until is None:
        return True
    return as_utc(now) < as_utc(access_until)


def new_trial_until(now: Optional[datetime] = None) -> datetime:
    moment = as_utc(now or datetime.now(timezone.utc))
    return moment + timedelta(days=TRIAL_DAYS)
