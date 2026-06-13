from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import Optional
import httpx
import os

import models
import schemas


CHANNEL_SERVICE_URL = os.getenv("CHANNEL_SERVICE_URL", "http://localhost:8001")


# ─────────────────────────────────────────
# CUSTOMERS
# ─────────────────────────────────────────

def create_customer(db: Session, data: schemas.CustomerCreate) -> models.Customer:
    customer = models.Customer(
        name=data.name,
        email=data.email,
        phone=data.phone,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_all_customers(db: Session) -> list[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()


# ─────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────

def create_order(db: Session, data: schemas.OrderCreate) -> models.Order:
    order = models.Order(
        customer_id=data.customer_id,
        total_amount=data.total_amount,
    )
    db.add(order)
    db.flush()  # get order.id before committing

    for item_data in data.items:
        item = models.OrderItem(
            order_id=order.id,
            product_name=item_data.product_name,
            category=item_data.category,
            sub_category=item_data.sub_category,
            quantity=item_data.quantity,
            price=item_data.price,
        )
        db.add(item)

    db.commit()
    db.refresh(order)

    # Check if this order qualifies as a campaign attribution
    _check_attribution(db, order)

    return order


def get_orders_for_customer(db: Session, customer_id: str) -> list[models.Order]:
    return (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


# ─────────────────────────────────────────
# SEGMENTATION
# ─────────────────────────────────────────

def evaluate_segment_filter(db: Session, filter_query: dict) -> list[models.Customer]:
    """
    Applies a structured filter_query to return matching customers.

    Supported filter keys:
        category (str)         — matches order_items.category
        sub_category (str)     — matches order_items.sub_category
        inactive_days (int)    — no order in last N days
        min_orders (int)       — placed at least N orders
        min_spend (float)      — total spend >= amount
    """
    query = db.query(models.Customer)

    category = filter_query.get("category")
    sub_category = filter_query.get("sub_category")
    inactive_days = filter_query.get("inactive_days")
    min_orders = filter_query.get("min_orders")
    min_spend = filter_query.get("min_spend")

    if category or sub_category:
        query = query.join(models.Order, models.Order.customer_id == models.Customer.id)
        query = query.join(models.OrderItem, models.OrderItem.order_id == models.Order.id)
        if category:
            query = query.filter(models.OrderItem.category == category)
        if sub_category:
            query = query.filter(models.OrderItem.sub_category == sub_category)

    if inactive_days is not None:
        cutoff = datetime.utcnow() - timedelta(days=inactive_days)
        # customers whose latest order is older than cutoff
        latest_order = (
            db.query(models.Order.customer_id, func.max(models.Order.created_at).label("last_order"))
            .group_by(models.Order.customer_id)
            .subquery()
        )
        query = query.join(latest_order, latest_order.c.customer_id == models.Customer.id)
        query = query.filter(latest_order.c.last_order < cutoff)

    if min_orders is not None:
        order_counts = (
            db.query(models.Order.customer_id, func.count(models.Order.id).label("order_count"))
            .group_by(models.Order.customer_id)
            .subquery()
        )
        query = query.join(order_counts, order_counts.c.customer_id == models.Customer.id)
        query = query.filter(order_counts.c.order_count >= min_orders)

    if min_spend is not None:
        spend_totals = (
            db.query(models.Order.customer_id, func.sum(models.Order.total_amount).label("total_spend"))
            .group_by(models.Order.customer_id)
            .subquery()
        )
        query = query.join(spend_totals, spend_totals.c.customer_id == models.Customer.id)
        query = query.filter(spend_totals.c.total_spend >= min_spend)

    return query.distinct().all()


def create_segment(db: Session, data: schemas.SegmentCreate) -> models.Segment:
    segment = models.Segment(
        name=data.name,
        description=data.description,
        filter_query=data.filter_query,
        created_by_ai=data.created_by_ai,
    )
    db.add(segment)
    db.flush()

    # Snapshot matching customers into segment_customers
    if data.filter_query:
        matched = evaluate_segment_filter(db, data.filter_query)
        for customer in matched:
            db.add(models.SegmentCustomer(
                segment_id=segment.id,
                customer_id=customer.id,
            ))

    db.commit()
    db.refresh(segment)
    return segment


def get_segment_with_count(db: Session, segment_id: str) -> Optional[models.Segment]:
    return db.query(models.Segment).filter(models.Segment.id == segment_id).first()


def get_segment_customer_count(db: Session, segment_id: str) -> int:
    return (
        db.query(func.count(models.SegmentCustomer.customer_id))
        .filter(models.SegmentCustomer.segment_id == segment_id)
        .scalar()
    )


def get_all_segments(db: Session) -> list[models.Segment]:
    return db.query(models.Segment).order_by(models.Segment.created_at.desc()).all()


# ─────────────────────────────────────────
# CAMPAIGNS
# ─────────────────────────────────────────

def create_campaign(db: Session, data: schemas.CampaignCreate) -> models.Campaign:
    campaign = models.Campaign(
        name=data.name,
        segment_id=data.segment_id,
        channel=data.channel,
        message_template=data.message_template,
        status=models.CampaignStatusEnum.draft,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def launch_campaign(db: Session, campaign_id: str) -> models.Campaign:
    """
    Creates a Message row for each customer in the segment,
    then fires them off to the channel service.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise ValueError("Campaign not found")
    if campaign.status != models.CampaignStatusEnum.draft:
        raise ValueError("Campaign already launched")

    segment_customers = (
        db.query(models.SegmentCustomer)
        .filter(models.SegmentCustomer.segment_id == campaign.segment_id)
        .all()
    )

    messages = []
    for sc in segment_customers:
        customer = db.query(models.Customer).filter(models.Customer.id == sc.customer_id).first()
        personalized_content = campaign.message_template.replace("{{name}}", customer.name)

        msg = models.Message(
            campaign_id=campaign.id,
            customer_id=customer.id,
            channel=campaign.channel,
            content=personalized_content,
            status=models.MessageStatusEnum.queued,
        )
        db.add(msg)
        db.flush()
        messages.append((msg, customer))

    campaign.status = models.CampaignStatusEnum.running
    campaign.sent_at = datetime.utcnow()
    db.commit()

    # Fire off to channel service (non-blocking)
    _dispatch_to_channel_service(messages)

    return campaign


def get_all_campaigns(db: Session) -> list[models.Campaign]:
    return db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).all()


def get_campaign_stats(db: Session, campaign_id: str) -> schemas.CampaignStatsOut:
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()

    counts = (
        db.query(models.Message.status, func.count(models.Message.id))
        .filter(models.Message.campaign_id == campaign_id)
        .group_by(models.Message.status)
        .all()
    )
    status_map = {status: count for status, count in counts}

    attributed_orders = (
        db.query(func.count(models.CampaignAttribution.id))
        .filter(models.CampaignAttribution.campaign_id == campaign_id)
        .scalar()
    )

    total = sum(status_map.values())

    return schemas.CampaignStatsOut(
        campaign_id=campaign_id,
        name=campaign.name,
        total=total,
        queued=status_map.get(models.MessageStatusEnum.queued, 0),
        sent=status_map.get(models.MessageStatusEnum.sent, 0),
        delivered=status_map.get(models.MessageStatusEnum.delivered, 0),
        failed=status_map.get(models.MessageStatusEnum.failed, 0),
        opened=status_map.get(models.MessageStatusEnum.opened, 0),
        read=status_map.get(models.MessageStatusEnum.read, 0),
        clicked=status_map.get(models.MessageStatusEnum.clicked, 0),
        attributed_orders=attributed_orders,
    )


# ─────────────────────────────────────────
# RECEIPTS (channel service callbacks)
# ─────────────────────────────────────────

def process_receipt(db: Session, payload: schemas.ReceiptPayload) -> models.Message:
    msg = db.query(models.Message).filter(models.Message.id == payload.message_id).first()
    if not msg:
        raise ValueError("Message not found")

    msg.status = payload.status
    ts = payload.timestamp

    if payload.status == models.MessageStatusEnum.sent:
        msg.sent_at = ts
    elif payload.status == models.MessageStatusEnum.delivered:
        msg.delivered_at = ts
    elif payload.status == models.MessageStatusEnum.opened:
        msg.opened_at = ts
    elif payload.status == models.MessageStatusEnum.read:
        msg.read_at = ts
    elif payload.status == models.MessageStatusEnum.clicked:
        msg.clicked_at = ts
    elif payload.status == models.MessageStatusEnum.failed:
        _record_failure(db, msg)

    db.commit()
    db.refresh(msg)
    return msg


def _record_failure(db: Session, msg: models.Message):
    existing = (
        db.query(models.FailedMessage)
        .filter(models.FailedMessage.message_id == msg.id)
        .first()
    )
    if existing:
        existing.retry_count += 1
    else:
        db.add(models.FailedMessage(
            message_id=msg.id,
            error_reason="Delivery failed from channel service",
            retry_count=1,
        ))


# ─────────────────────────────────────────
# ATTRIBUTION
# ─────────────────────────────────────────

def _check_attribution(db: Session, order: models.Order):
    """
    Called after every new order. If the customer clicked a campaign
    message within the last 24 hours, record an attribution.
    """
    cutoff = order.created_at - timedelta(hours=24)

    clicked_message = (
        db.query(models.Message)
        .filter(
            and_(
                models.Message.customer_id == order.customer_id,
                models.Message.status == models.MessageStatusEnum.clicked,
                models.Message.clicked_at >= cutoff,
                models.Message.clicked_at <= order.created_at,
            )
        )
        .order_by(models.Message.clicked_at.desc())
        .first()
    )

    if clicked_message:
        already_attributed = (
            db.query(models.CampaignAttribution)
            .filter(
                and_(
                    models.CampaignAttribution.message_id == clicked_message.id,
                    models.CampaignAttribution.order_id == order.id,
                )
            )
            .first()
        )
        if not already_attributed:
            db.add(models.CampaignAttribution(
                message_id=clicked_message.id,
                customer_id=order.customer_id,
                campaign_id=clicked_message.campaign_id,
                order_id=order.id,
                clicked_at=clicked_message.clicked_at,
                ordered_at=order.created_at,
            ))
            db.commit()


# ─────────────────────────────────────────
# CHANNEL SERVICE DISPATCH
# ─────────────────────────────────────────

# services.py
import asyncio
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(max_workers=4)

def _dispatch_to_channel_service(messages: list[tuple[models.Message, models.Customer]]):
    """Fire and forget — runs in a thread so it doesn't block the route handler."""
    def _send_all():
        with httpx.Client(timeout=10.0) as client:
            for msg, customer in messages:
                try:
                    client.post(
                        f"{CHANNEL_SERVICE_URL}/send",
                        json={
                            "message_id": msg.id,
                            "recipient": customer.email or customer.phone,
                            "message": msg.content,
                            "channel": msg.channel.value,
                        },
                    )
                    print(f"[dispatch] Sent {msg.id}")
                except Exception as e:
                    print(f"[channel-service] Failed to dispatch message {msg.id}: {e}")

    _executor.submit(_send_all)