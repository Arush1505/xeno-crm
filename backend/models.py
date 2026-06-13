from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, Enum, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


# ---------- Enums ----------

class ChannelEnum(str, enum.Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    rcs = "rcs"

class CampaignStatusEnum(str, enum.Enum):
    draft = "draft"
    running = "running"
    completed = "completed"

class MessageStatusEnum(str, enum.Enum):
    queued = "queued"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    opened = "opened"
    read = "read"
    clicked = "clicked"


# ---------- Core ----------

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    orders = relationship("Order", back_populates="customer")
    messages = relationship("Message", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_name = Column(String, nullable=False)
    category = Column(String, nullable=False)       # e.g. Fashion, Sports
    sub_category = Column(String, nullable=True)    # e.g. Perfumes, Shoes
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


# ---------- Segmentation ----------

class Segment(Base):
    __tablename__ = "segments"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    filter_query = Column(JSON, nullable=True)      # AI-generated filter params
    created_by_ai = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    campaigns = relationship("Campaign", back_populates="segment")
    segment_customers = relationship("SegmentCustomer", back_populates="segment")


class SegmentCustomer(Base):
    __tablename__ = "segment_customers"

    segment_id = Column(String, ForeignKey("segments.id"), primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"), primary_key=True)
    added_at = Column(DateTime, server_default=func.now())

    segment = relationship("Segment", back_populates="segment_customers")
    customer = relationship("Customer")


# ---------- Campaigns & Messaging ----------

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    segment_id = Column(String, ForeignKey("segments.id"), nullable=False)
    channel = Column(Enum(ChannelEnum), nullable=False)
    message_template = Column(Text, nullable=False)
    status = Column(Enum(CampaignStatusEnum), default=CampaignStatusEnum.draft)
    created_at = Column(DateTime, server_default=func.now())
    sent_at = Column(DateTime, nullable=True)

    segment = relationship("Segment", back_populates="campaigns")
    messages = relationship("Message", back_populates="campaign")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    channel = Column(Enum(ChannelEnum), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(MessageStatusEnum), default=MessageStatusEnum.queued)

    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, onupdate=func.now())

    campaign = relationship("Campaign", back_populates="messages")
    customer = relationship("Customer", back_populates="messages")


# ---------- Attribution ----------

class CampaignAttribution(Base):
    __tablename__ = "campaign_attributions"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    clicked_at = Column(DateTime, nullable=False)
    ordered_at = Column(DateTime, nullable=False)


# ---------- Error Tracking ----------

class FailedMessage(Base):
    __tablename__ = "failed_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    error_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    reported = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


# ---------- AI Agent Logs ----------

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    input_prompt = Column(Text, nullable=False)
    actions_taken = Column(JSON, nullable=True)     # list of tool calls + results
    result_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())