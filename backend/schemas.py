from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ---------- Enums ----------

class ChannelEnum(str, Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    rcs = "rcs"

class CampaignStatusEnum(str, Enum):
    draft = "draft"
    running = "running"
    completed = "completed"

class MessageStatusEnum(str, Enum):
    queued = "queued"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    opened = "opened"
    read = "read"
    clicked = "clicked"


# ---------- Customer ----------

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str

class CustomerOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Order ----------

class OrderItemCreate(BaseModel):
    product_name: str
    category: str
    sub_category: Optional[str] = None
    quantity: int
    price: float

class OrderCreate(BaseModel):
    customer_id: str
    total_amount: float
    items: List[OrderItemCreate]

class OrderItemOut(BaseModel):
    id: str
    product_name: str
    category: str
    sub_category: Optional[str]
    quantity: int
    price: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    customer_id: str
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


# ---------- Segment ----------

class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    filter_query: Optional[dict] = None
    created_by_ai: bool = False

class AISegmentRequest(BaseModel):
    prompt: str                         # e.g. "Fashion buyers inactive for 30 days"

class SegmentOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    filter_query: Optional[dict]
    created_by_ai: bool
    created_at: datetime
    customer_count: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Campaign ----------

class CampaignCreate(BaseModel):
    name: str
    segment_id: str
    channel: ChannelEnum
    message_template: str

class CampaignOut(BaseModel):
    id: str
    name: str
    segment_id: str
    channel: ChannelEnum
    message_template: str
    status: CampaignStatusEnum
    created_at: datetime
    sent_at: Optional[datetime]

    class Config:
        from_attributes = True

class CampaignStatsOut(BaseModel):
    campaign_id: str
    name: str
    total: int
    queued: int
    sent: int
    delivered: int
    failed: int
    opened: int
    read: int
    clicked: int
    attributed_orders: int              # orders that came from this campaign


# ---------- Message ----------

class MessageOut(BaseModel):
    id: str
    campaign_id: str
    customer_id: str
    channel: ChannelEnum
    content: str
    status: MessageStatusEnum
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    opened_at: Optional[datetime]
    read_at: Optional[datetime]
    clicked_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Receipt (Channel Service Callback) ----------

class ReceiptPayload(BaseModel):
    message_id: str
    status: MessageStatusEnum
    timestamp: datetime


# ---------- Failed Message ----------

class FailedMessageOut(BaseModel):
    id: str
    message_id: str
    error_reason: Optional[str]
    retry_count: int
    reported: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- AI Agent ----------

class AgentRequest(BaseModel):
    prompt: str                         # e.g. "Run a re-engagement campaign for churned users"

class AgentRunOut(BaseModel):
    id: str
    input_prompt: str
    actions_taken: Optional[list]
    result_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True