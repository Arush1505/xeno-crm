import random
from datetime import datetime, timedelta
from faker import Faker
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

fake = Faker("en_IN")  # Indian locale — fits the brand context
random.seed(42)

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────

NUM_CUSTOMERS = 300
MAX_ORDERS_PER_CUSTOMER = 5

CATEGORIES = {
    "Fashion":   ["Perfumes", "Shoes", "Bags", "Watches", "Sunglasses"],
    "Sports":    ["Running Gear", "Gym Equipment", "Yoga", "Cycling", "Swimwear"],
    "Beauty":    ["Skincare", "Haircare", "Makeup", "Nail Care", "Serums"],
    "Food":      ["Snacks", "Coffee", "Tea", "Health Drinks", "Supplements"],
    "Home":      ["Decor", "Bedding", "Kitchenware", "Lighting", "Storage"],
}

CHANNELS = ["whatsapp", "sms", "email", "rcs"]


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def random_past_date(days_back: int = 180) -> datetime:
    return datetime.utcnow() - timedelta(days=random.randint(0, days_back))


def random_category() -> tuple[str, str]:
    category = random.choice(list(CATEGORIES.keys()))
    sub_category = random.choice(CATEGORIES[category])
    return category, sub_category


def random_product_name(category: str, sub_category: str) -> str:
    brands = {
        "Fashion":  ["Zara", "H&M", "Mango", "W", "FabIndia"],
        "Sports":   ["Nike", "Adidas", "Puma", "Decathlon", "Reebok"],
        "Beauty":   ["Lakme", "Nykaa", "Minimalist", "Dot & Key", "Mamaearth"],
        "Food":     ["Yoga Bar", "Slurrp Farm", "Epigamia", "Rage Coffee", "Oziva"],
        "Home":     ["IKEA", "Pepperfry", "Urban Ladder", "Fabindia", "Nestasia"],
    }
    brand = random.choice(brands[category])
    return f"{brand} {sub_category} {fake.word().capitalize()}"


# ─────────────────────────────────────────
# Seeders
# ─────────────────────────────────────────

def seed_customers(db) -> list[models.Customer]:
    print("Seeding customers...")
    customers = []
    seen_emails = set()
    seen_phones = set()

    while len(customers) < NUM_CUSTOMERS:
        email = fake.unique.email()
        phone = f"+91{random.randint(7000000000, 9999999999)}"

        if email in seen_emails or phone in seen_phones:
            continue

        seen_emails.add(email)
        seen_phones.add(phone)

        customer = models.Customer(
            name=fake.name(),
            email=email,
            phone=phone,
            created_at=random_past_date(365),
        )
        db.add(customer)
        customers.append(customer)

    db.commit()
    print(f"  ✓ {len(customers)} customers created")
    return customers


def seed_orders(db, customers: list[models.Customer]):
    print("Seeding orders...")
    total_orders = 0

    for customer in customers:
        # Not every customer has orders — simulates churned users
        num_orders = random.choices(
            [0, 1, 2, 3, 4, 5],
            weights=[15, 20, 25, 20, 12, 8],
        )[0]

        for _ in range(num_orders):
            order_date = random_past_date(180)

            num_items = random.randint(1, 4)
            items = []
            total = 0.0

            for _ in range(num_items):
                category, sub_category = random_category()
                price = round(random.uniform(199, 4999), 2)
                qty = random.randint(1, 3)
                total += price * qty

                items.append(models.OrderItem(
                    product_name=random_product_name(category, sub_category),
                    category=category,
                    sub_category=sub_category,
                    quantity=qty,
                    price=price,
                ))

            order = models.Order(
                customer_id=customer.id,
                total_amount=round(total, 2),
                created_at=order_date,
            )
            db.add(order)
            db.flush()

            for item in items:
                item.order_id = order.id
                db.add(item)

            total_orders += 1

    db.commit()
    print(f"  ✓ {total_orders} orders created")


def seed_segments(db, customers: list[models.Customer]):
    print("Seeding segments...")

    predefined = [
        {
            "name": "Fashion Buyers",
            "description": "Customers who have bought Fashion products",
            "filter_query": {"category": "Fashion"},
            "created_by_ai": False,
        },
        {
            "name": "Churned Users (60d)",
            "description": "Customers with no order in the last 60 days",
            "filter_query": {"inactive_days": 60},
            "created_by_ai": False,
        },
        {
            "name": "High Value Customers",
            "description": "Customers who spent more than ₹5000 total",
            "filter_query": {"min_spend": 5000.0},
            "created_by_ai": False,
        },
        {
            "name": "AI: Perfume Enthusiasts",
            "description": "Customers who bought perfumes at least twice",
            "filter_query": {"sub_category": "Perfumes", "min_orders": 2},
            "created_by_ai": True,
        },
        {
            "name": "AI: Lapsed Sports Buyers",
            "description": "Sports category buyers inactive for 45 days",
            "filter_query": {"category": "Sports", "inactive_days": 45},
            "created_by_ai": True,
        },
    ]

    from services import evaluate_segment_filter

    for seg_data in predefined:
        segment = models.Segment(
            name=seg_data["name"],
            description=seg_data["description"],
            filter_query=seg_data["filter_query"],
            created_by_ai=seg_data["created_by_ai"],
        )
        db.add(segment)
        db.flush()

        matched = evaluate_segment_filter(db, seg_data["filter_query"])
        for customer in matched:
            db.add(models.SegmentCustomer(
                segment_id=segment.id,
                customer_id=customer.id,
            ))

    db.commit()
    print(f"  ✓ {len(predefined)} segments created")


def seed_campaigns(db):
    print("Seeding campaigns...")

    segments = db.query(models.Segment).all()
    if not segments:
        print("  ✗ No segments found, skipping campaigns")
        return

    campaign_templates = [
        {
            "name": "Summer Fashion Drop",
            "channel": "whatsapp",
            "message_template": "Hi {{name}}, our Summer Fashion collection just dropped! Shop now and get 15% off. Limited time only 🛍️",
        },
        {
            "name": "We Miss You",
            "channel": "sms",
            "message_template": "Hi {{name}}, it's been a while! Come back and enjoy 10% off your next order. Use code MISSYOU10.",
        },
        {
            "name": "VIP Early Access",
            "channel": "email",
            "message_template": "Hi {{name}}, as one of our top customers you get exclusive early access to our new arrivals. Shop before anyone else!",
        },
        {
            "name": "Sports Restock Alert",
            "channel": "rcs",
            "message_template": "Hey {{name}}! Your favourite Sports products are back in stock. Grab them before they sell out again 💪",
        },
    ]

    for i, tmpl in enumerate(campaign_templates):
        segment = segments[i % len(segments)]

        campaign = models.Campaign(
            name=tmpl["name"],
            segment_id=segment.id,
            channel=tmpl["channel"],
            message_template=tmpl["message_template"],
            status=models.CampaignStatusEnum.draft,
        )
        db.add(campaign)

    db.commit()
    print(f"  ✓ {len(campaign_templates)} campaigns created (all in draft)")


# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

def run():
    db = SessionLocal()
    try:
        # Guard against re-seeding
        existing = db.query(models.Customer).count()
        if existing > 0:
            print(f"Database already has {existing} customers. Skipping seed.")
            print("To re-seed, clear the database first.")
            return

        print("\n── Xeno CRM Seed ──────────────────────\n")
        start = datetime.utcnow()

        customers = seed_customers(db)
        seed_orders(db, customers)
        seed_segments(db, customers)
        seed_campaigns(db)

        elapsed = (datetime.utcnow() - start).total_seconds()
        print(f"\n── Done in {elapsed:.1f}s ─────────────────────\n")

    finally:
        db.close()


if __name__ == "__main__":
    run()