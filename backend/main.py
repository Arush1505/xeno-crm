from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import services
import ai_agent
from database import engine, get_db

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xeno Mini CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "crm-backend"}


# ─────────────────────────────────────────
# CUSTOMERS
# ─────────────────────────────────────────

@app.post("/api/customers", response_model=schemas.CustomerOut)
def create_customer(data: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return services.create_customer(db, data)


@app.get("/api/customers", response_model=List[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return services.get_all_customers(db)


# ─────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────

@app.post("/api/orders", response_model=schemas.OrderOut)
def create_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return services.create_order(db, data)


@app.get("/api/customers/{customer_id}/orders", response_model=List[schemas.OrderOut])
def get_customer_orders(customer_id: str, db: Session = Depends(get_db)):
    return services.get_orders_for_customer(db, customer_id)


# ─────────────────────────────────────────
# SEGMENTS
# ─────────────────────────────────────────

@app.post("/api/segments", response_model=schemas.SegmentOut)
def create_segment(data: schemas.SegmentCreate, db: Session = Depends(get_db)):
    segment = services.create_segment(db, data)
    count = services.get_segment_customer_count(db, segment.id)
    result = schemas.SegmentOut.model_validate(segment)
    result.customer_count = count
    return result


@app.get("/api/segments", response_model=List[schemas.SegmentOut])
def list_segments(db: Session = Depends(get_db)):
    segments = services.get_all_segments(db)
    result = []
    for seg in segments:
        out = schemas.SegmentOut.model_validate(seg)
        out.customer_count = services.get_segment_customer_count(db, seg.id)
        result.append(out)
    return result


@app.get("/api/segments/{segment_id}", response_model=schemas.SegmentOut)
def get_segment(segment_id: str, db: Session = Depends(get_db)):
    segment = services.get_segment_with_count(db, segment_id)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    out = schemas.SegmentOut.model_validate(segment)
    out.customer_count = services.get_segment_customer_count(db, segment_id)
    return out


@app.post("/api/segments/ai-generate", response_model=schemas.SegmentOut)
async def ai_generate_segment(data: schemas.AISegmentRequest, db: Session = Depends(get_db)):
    """
    Takes a natural language prompt, asks Gemini to produce
    a filter_query dict, then creates and snapshots the segment.
    """
    segment_data = await ai_agent.generate_segment_from_prompt(db, data.prompt)
    segment = services.create_segment(db, segment_data)
    out = schemas.SegmentOut.model_validate(segment)
    out.customer_count = services.get_segment_customer_count(db, segment.id)
    return out


# ─────────────────────────────────────────
# CAMPAIGNS
# ─────────────────────────────────────────

@app.post("/api/campaigns", response_model=schemas.CampaignOut)
def create_campaign(data: schemas.CampaignCreate, db: Session = Depends(get_db)):
    segment = db.query(models.Segment).filter(models.Segment.id == data.segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return services.create_campaign(db, data)


@app.get("/api/campaigns", response_model=List[schemas.CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    return services.get_all_campaigns(db)


@app.get("/api/campaigns/{campaign_id}", response_model=schemas.CampaignOut)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@app.post("/api/campaigns/{campaign_id}/launch", response_model=schemas.CampaignOut)
def launch_campaign(campaign_id: str, db: Session = Depends(get_db)):
    try:
        return services.launch_campaign(db, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/campaigns/{campaign_id}/stats", response_model=schemas.CampaignStatsOut)
def get_campaign_stats(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return services.get_campaign_stats(db, campaign_id)


@app.get("/api/campaigns/{campaign_id}/messages", response_model=List[schemas.MessageOut])
def get_campaign_messages(campaign_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Message)
        .filter(models.Message.campaign_id == campaign_id)
        .all()
    )


# ─────────────────────────────────────────
# RECEIPTS (channel service callbacks)
# ─────────────────────────────────────────

@app.post("/api/receipts")
def receive_receipt(payload: schemas.ReceiptPayload, db: Session = Depends(get_db)):
    """
    Called by the channel service with each status update.
    Updates message state and checks attribution.
    """
    try:
        services.process_receipt(db, payload)
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────
# FAILED MESSAGES
# ─────────────────────────────────────────

@app.get("/api/failed-messages", response_model=List[schemas.FailedMessageOut])
def list_failed_messages(db: Session = Depends(get_db)):
    return db.query(models.FailedMessage).order_by(models.FailedMessage.created_at.desc()).all()


@app.post("/api/failed-messages/{failed_id}/report")
def report_failed_message(failed_id: str, db: Session = Depends(get_db)):
    record = db.query(models.FailedMessage).filter(models.FailedMessage.id == failed_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.reported = True
    db.commit()
    return {"status": "reported"}


# ─────────────────────────────────────────
# AI AGENT
# ─────────────────────────────────────────

@app.post("/api/agent/run", response_model=schemas.AgentRunOut)
async def run_agent(data: schemas.AgentRequest, db: Session = Depends(get_db)):
    """
    Takes a natural language goal and runs the Gemini agent
    end-to-end: segment → message → launch → monitor.
    """
    return await ai_agent.run_agent(db, data.prompt)


@app.get("/api/agent/runs", response_model=List[schemas.AgentRunOut])
def list_agent_runs(db: Session = Depends(get_db)):
    return (
        db.query(models.AgentRun)
        .order_by(models.AgentRun.created_at.desc())
        .all()
    )


# ─────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    """
    Single endpoint that returns all the numbers
    the dashboard needs in one shot.
    """
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    total_campaigns = db.query(models.Campaign).count()
    total_messages = db.query(models.Message).count()

    messages_by_status = (
        db.query(models.Message.status, models.func.count(models.Message.id))
        .group_by(models.Message.status)
        .all()
    )
    status_breakdown = {status.value: count for status, count in messages_by_status}

    total_attributed = db.query(models.CampaignAttribution).count()

    recent_campaigns = (
        db.query(models.Campaign)
        .order_by(models.Campaign.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_campaigns": total_campaigns,
        "total_messages": total_messages,
        "status_breakdown": status_breakdown,
        "total_attributed_orders": total_attributed,
        "recent_campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "channel": c.channel,
                "sent_at": c.sent_at,
            }
            for c in recent_campaigns
        ],
    }