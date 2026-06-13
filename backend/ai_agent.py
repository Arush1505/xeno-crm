import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
# 👇 UPDATED IMPORT
from google import genai
from dotenv import load_dotenv

import models
import schemas
import services

load_dotenv()

# 👇 UPDATED INITIALIZATION
# The client automatically reads GEMINI_API_KEY from your .env file
client = genai.Client()
MODEL_NAME = "models/gemini-2.5-flash"


# ─────────────────────────────────────────
# SEGMENT GENERATION
# ─────────────────────────────────────────

async def generate_segment_from_prompt(db: Session, prompt: str) -> schemas.SegmentCreate:
    """
    Takes a natural language prompt from the marketer,
    asks Gemini to produce a structured filter_query dict,
    returns a SegmentCreate ready to be saved.
    """

    system_prompt = """
You are a CRM segmentation assistant. Convert the marketer's natural language
request into a JSON filter object.

Supported filter keys:
  - category (str)        : product category e.g. "Fashion", "Sports", "Beauty"
  - sub_category (str)    : product sub-category e.g. "Perfumes", "Shoes"
  - inactive_days (int)   : customers with no order in last N days
  - min_orders (int)      : customers who placed at least N orders
  - min_spend (float)     : customers whose total spend >= amount

Rules:
  - Return ONLY a valid JSON object. No explanation, no markdown, no backticks.
  - Only include keys that are relevant to the request.
  - If a key is not mentioned, omit it entirely.

Examples:
  Input:  "Fashion buyers who haven't ordered in 30 days"
  Output: {"category": "Fashion", "inactive_days": 30}

  Input:  "High value customers who spent more than 5000"
  Output: {"min_spend": 5000.0}

  Input:  "Customers who bought perfumes at least 3 times"
  Output: {"sub_category": "Perfumes", "min_orders": 3}
"""

    # 👇 UPDATED API CALL
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=f"{system_prompt}\n\nInput: {prompt}"
    )

    raw = response.text.strip()

    try:
        filter_query = json.loads(raw)
    except json.JSONDecodeError:
        # Gemini occasionally wraps in backticks despite instructions — strip and retry
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        filter_query = json.loads(cleaned)

    return schemas.SegmentCreate(
        name=f"AI Segment: {prompt[:60]}",
        description=prompt,
        filter_query=filter_query,
        created_by_ai=True,
    )


# ─────────────────────────────────────────
# MESSAGE PERSONALISATION
# ─────────────────────────────────────────

async def generate_message_for_segment(segment: models.Segment, channel: str) -> str:
    """
    Given a segment and channel, generates a personalised
    message template. Uses {{name}} as the placeholder
    which services.py replaces per customer at send time.
    """

    prompt = f"""
You are a marketing copywriter for a D2C brand.
Write a short, personalised campaign message for the following audience:

Segment: {segment.name}
Description: {segment.description or "No description provided"}
Channel: {channel}

Rules:
  - Use {{{{name}}}} as the customer name placeholder.
  - Keep it under 160 characters for SMS, under 300 for others.
  - Sound friendly and human, not robotic.
  - Do not use hashtags or excessive emojis.
  - Return ONLY the message text. No explanation.

Example output for WhatsApp:
  Hi {{{{name}}}}, we miss you! Come back and explore our latest Fashion arrivals. Use code BACK10 for 10% off.
"""

    # 👇 UPDATED API CALL
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    return response.text.strip()


# ─────────────────────────────────────────
# AI AGENT
# ─────────────────────────────────────────

async def run_agent(db: Session, user_prompt: str) -> models.AgentRun:
    """
    Full autonomous agent loop.
    """

    actions = []

    def log(action: str, result):
        print(f"[agent] {action}: {result}")
        actions.append({"action": action, "result": result, "timestamp": datetime.utcnow().isoformat()})

    # ── Step 1: Plan ──────────────────────────────────────────
    plan_prompt = f"""
You are an AI marketing agent for a CRM platform.
A marketer gave you this goal: "{user_prompt}"

Your job is to plan a campaign. Respond ONLY with a JSON object with these keys:
  - segment_prompt (str) : natural language description of the audience to target
  - channel (str)        : one of whatsapp, sms, email, rcs — best fit for this goal
  - campaign_name (str)  : a short campaign name

Example:
{{
  "segment_prompt": "Customers who bought sports items but haven't ordered in 45 days",
  "channel": "whatsapp",
  "campaign_name": "Sports Re-engagement June"
}}

Return ONLY the JSON. No explanation.
"""

    # 👇 UPDATED API CALL
    plan_response = client.models.generate_content(
        model=MODEL_NAME,
        contents=plan_prompt
    )
    raw_plan = plan_response.text.strip().replace("```json", "").replace("```", "").strip()

    try:
        plan = json.loads(raw_plan)
    except json.JSONDecodeError as e:
        raise ValueError(f"Agent failed to produce a valid plan: {e}\nRaw: {raw_plan}")

    log("plan", plan)

    # ── Step 2: Generate Segment ──────────────────────────────
    segment_data = await generate_segment_from_prompt(db, plan["segment_prompt"])
    segment = services.create_segment(db, segment_data)
    customer_count = services.get_segment_customer_count(db, segment.id)

    log("segment_created", {
        "id": segment.id,
        "name": segment.name,
        "filter_query": segment.filter_query,
        "customer_count": customer_count,
    })

    if customer_count == 0:
        summary = "Agent created a segment but found 0 matching customers. Campaign was not launched."
        return _save_agent_run(db, user_prompt, actions, summary)

    # ── Step 3: Generate Message ──────────────────────────────
    message_template = await generate_message_for_segment(segment, plan["channel"])

    log("message_generated", {
        "channel": plan["channel"],
        "template": message_template,
    })

    # ── Step 4: Create Campaign ───────────────────────────────
    campaign_data = schemas.CampaignCreate(
        name=plan["campaign_name"],
        segment_id=segment.id,
        channel=plan["channel"],
        message_template=message_template,
    )
    campaign = services.create_campaign(db, campaign_data)

    log("campaign_created", {
        "id": campaign.id,
        "name": campaign.name,
        "channel": campaign.channel,
    })

    # ── Step 5: Launch ────────────────────────────────────────
    services.launch_campaign(db, campaign.id)

    log("campaign_launched", {
        "campaign_id": campaign.id,
        "messages_sent": customer_count,
    })

    # ── Step 6: Summarise ─────────────────────────────────────
    summary_prompt = f"""
A marketing campaign was just executed. Summarise what happened in 2-3 sentences
for the marketer. Be specific with the numbers.

Goal: {user_prompt}
Segment: {segment.name} ({customer_count} customers)
Channel: {plan["channel"]}
Message: {message_template}
Campaign name: {plan["campaign_name"]}
"""

    # 👇 UPDATED API CALL
    summary_response = client.models.generate_content(
        model=MODEL_NAME,
        contents=summary_prompt
    )
    summary = summary_response.text.strip()

    log("summary_generated", summary)

    return _save_agent_run(db, user_prompt, actions, summary)


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────

def _save_agent_run(
    db: Session,
    prompt: str,
    actions: list,
    summary: str,
) -> models.AgentRun:
    run = models.AgentRun(
        input_prompt=prompt,
        actions_taken=actions,
        result_summary=summary,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run