from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import asyncio
import random
from datetime import datetime, timedelta
from enum import Enum
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Xeno Channel Service (Stub)")

CRM_RECEIPT_URL = os.getenv("CRM_RECEIPT_URL", "http://localhost:8000/api/receipts")


# ─────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────

class ChannelEnum(str, Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    rcs = "rcs"

class SendRequest(BaseModel):
    message_id: str
    recipient: str
    message: str
    channel: ChannelEnum


# ─────────────────────────────────────────
# Simulation Config
# ─────────────────────────────────────────

# Probability weights per channel for each status outcome
# Each channel has slightly different delivery characteristics
CHANNEL_PROFILES = {
    ChannelEnum.whatsapp: {
        "fail_rate": 0.05,
        "open_rate": 0.80,
        "read_rate": 0.70,
        "click_rate": 0.30,
    },
    ChannelEnum.sms: {
        "fail_rate": 0.08,
        "open_rate": 0.65,
        "read_rate": 0.55,
        "click_rate": 0.15,
    },
    ChannelEnum.email: {
        "fail_rate": 0.10,
        "open_rate": 0.40,
        "read_rate": 0.30,
        "click_rate": 0.10,
    },
    ChannelEnum.rcs: {
        "fail_rate": 0.06,
        "open_rate": 0.70,
        "read_rate": 0.60,
        "click_rate": 0.25,
    },
}

# Simulated delays (seconds) between status transitions
# Keeps the demo feeling realistic without waiting too long
DELAY_RANGES = {
    "sent":      (0.5, 1.5),
    "delivered": (1.0, 3.0),
    "opened":    (2.0, 6.0),
    "read":      (1.0, 3.0),
    "clicked":   (1.0, 4.0),
}


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "channel-service"}


@app.post("/send")
async def send_message(payload: SendRequest):
    """
    Receives a send request from the CRM.
    Immediately returns 200, then simulates
    the message lifecycle asynchronously.
    """
    await asyncio.sleep(random.uniform(0, 2))
    asyncio.create_task(simulate_delivery(payload))
    return {"status": "accepted", "message_id": payload.message_id}



# ─────────────────────────────────────────
# Simulator
# ─────────────────────────────────────────

async def simulate_delivery(payload: SendRequest):
    """
    Simulates the full message lifecycle and POSTs
    status callbacks back to the CRM receipt endpoint.

    Flow:
        sent → delivered → [opened → read → clicked]
                        ↘ failed (at any stage)
    """
    profile = CHANNEL_PROFILES[payload.channel]
    now = datetime.utcnow()

    # Step 1: sent (almost always succeeds)
    await asyncio.sleep(random.uniform(*DELAY_RANGES["sent"]))
    await _post_callback(payload.message_id, "sent", now)

    # Step 2: delivered or failed
    await asyncio.sleep(random.uniform(*DELAY_RANGES["delivered"]))

    if random.random() < profile["fail_rate"]:
        await _post_callback(payload.message_id, "failed", _offset(now, DELAY_RANGES["delivered"]))
        return  # stop here, message failed

    delivered_at = _offset(now, DELAY_RANGES["delivered"])
    await _post_callback(payload.message_id, "delivered", delivered_at)

    # Step 3: opened (not guaranteed)
    await asyncio.sleep(random.uniform(*DELAY_RANGES["opened"]))

    if random.random() > profile["open_rate"]:
        return  # delivered but never opened

    opened_at = _offset(delivered_at, DELAY_RANGES["opened"])
    await _post_callback(payload.message_id, "opened", opened_at)

    # Step 4: read (subset of opened)
    await asyncio.sleep(random.uniform(*DELAY_RANGES["read"]))

    if random.random() > profile["read_rate"]:
        return  # opened but not read

    read_at = _offset(opened_at, DELAY_RANGES["read"])
    await _post_callback(payload.message_id, "read", read_at)

    # Step 5: clicked (subset of read)
    await asyncio.sleep(random.uniform(*DELAY_RANGES["clicked"]))

    if random.random() > profile["click_rate"]:
        return  # read but not clicked

    clicked_at = _offset(read_at, DELAY_RANGES["clicked"])
    await _post_callback(payload.message_id, "clicked", clicked_at)


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

async def _post_callback(message_id: str, status: str, timestamp: datetime):
    """
    POSTs a single status update back to the CRM.
    Retries up to 3 times on failure.
    """
    payload = {
        "message_id": message_id,
        "status": status,
        "timestamp": timestamp.isoformat(),
    }

    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(CRM_RECEIPT_URL, json=payload)
                response.raise_for_status()
                print(f"[callback] {status.upper()} → {message_id} (attempt {attempt})")
                return
        except Exception as e:
            print(f"[callback] Failed attempt {attempt} for {message_id} ({status}): {e}")
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)  # exponential backoff: 2s, 4s

    print(f"[callback] Gave up on {message_id} ({status}) after 3 attempts")


def _offset(base: datetime, delay_range: tuple) -> datetime:
    """Returns a datetime offset from base by a random amount in the delay range."""
    seconds = random.uniform(*delay_range)
    return base + timedelta(seconds=seconds)