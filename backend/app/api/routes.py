# (itertools.product not needed)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connections import get_db
from app.model.model import (
    Farmer, Buyer, Organizer, FoodProduct, CraftProduct,
    Order, OrganizerRequest, Admin, PriceSuggestion,
    RiskEvent, RiskAlertLog,
)
from app.schemas.schemas import (
    FarmerRegister, FarmerResponse,
    BuyerRegister, BuyerResponse,
    OrganizerRegister, OrganizerResponse,
    FoodProductCreate, FoodProductResponse,
    CraftProductCreate, CraftProductResponse,
    OrderCreate, OrderResponse,
    OrganizerRequestCreate, OrganizerRequestResponse,
    AdminRegister, AdminResponse,
    FoodProductListResponse, CraftProductListResponse,
    PriceSuggestionResponse, FoodPriceUpdate,
    FarmerFoodItem, FarmerCraftItem,
    RiskAlertRequest,
)
from app.utils.price_predictor import get_predicted_price
from app.utils.security import hash_password
from app.utils.risk_engine import run_risk_analysis
from fastapi import File, UploadFile, Form
import shutil
import os
import uuid
import json
from app.utils.geocode import get_lat_lng
from app.utils.locations import calculate_distance
from app.utils.sms import send_sms


# Ensure the uploads directory exists
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("uploads/videos", exist_ok=True)


router = APIRouter(prefix="/auth", tags=["Auth"])

# -------------------------------
# FARMER REGISTER
# -------------------------------
@router.post("/register/farmer", response_model=FarmerResponse)
def register_farmer(user: FarmerRegister, db: Session = Depends(get_db)):

    if db.query(Farmer).filter(Farmer.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    lat, lng = get_lat_lng(user.address)

    if lat is None:
        raise HTTPException(status_code=400, detail="Invalid address")

    new_farmer = Farmer(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        address=user.address,
        farm_name=user.farm_name,
        latitude=lat,
        longitude=lng,
        language=user.language
        
    )

    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)

    return new_farmer


# -------------------------------
# BUYER REGISTER
# -------------------------------
@router.post("/register/buyer", response_model=BuyerResponse)
def register_buyer(user: BuyerRegister, db: Session = Depends(get_db)):

    if db.query(Buyer).filter(Buyer.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_buyer = Buyer(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        address=user.address
    )

    db.add(new_buyer)
    db.commit()
    db.refresh(new_buyer)

    return new_buyer


# -------------------------------
# ORGANIZER REGISTER
# -------------------------------
@router.post("/register/organizer", response_model=OrganizerResponse)
def register_organizer(user: OrganizerRegister, db: Session = Depends(get_db)):

    if db.query(Organizer).filter(Organizer.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_org = Organizer(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        address=user.address,
        organization_name=user.organization_name
    )

    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    return new_org

@router.post("/food/{farmer_id}", response_model=FoodProductResponse)
def add_food_product(farmer_id: int, product: FoodProductCreate, db: Session = Depends(get_db)):

    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    new_product = FoodProduct(
        name=product.name,
        price=product.price,
        quantity=product.quantity,
        farmer_id=farmer_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # ── Price prediction check ──────────────────────────────────────────────
    try:
        region = farmer.address or ""
        predicted = get_predicted_price(product.name, region)

        if predicted is not None and product.price < predicted:
            # Log suggestion to DB
            suggestion = PriceSuggestion(
                farmer_id=farmer_id,
                product_id=new_product.id,
                product_name=product.name,
                entered_price=product.price,
                predicted_price=predicted,
                region=region,
            )
            db.add(suggestion)
            db.commit()

            # Send SMS alert to farmer
            msg = (
                f"Price Alert for {product.name}: "
                f"You listed it at Rs.{product.price}, but the market price "
                f"is around Rs.{predicted}. "
                f"Consider updating your price to earn more!"
            )
            language = getattr(farmer, "language", "en")
            send_sms(farmer.phone, msg, language)
    except Exception as e:
        # Never fail the product creation because of price check
        print(f"[PriceCheck] Error: {e}")
    # ────────────────────────────────────────────────────────────────────────

    return new_product


# -------------------------------
# ADD CRAFT PRODUCT
# -------------------------------
@router.post("/craft/{farmer_id}")
def add_craft_product(
    farmer_id: int,
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(None),
    image: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db)
):

    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    image_path = None
    video_path = None

    # Save image
    # Save image
    if image:
        unique_filename = f"{uuid.uuid4()}_{image.filename}"
        image_path = f"uploads/images/{unique_filename}"

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    # Save video
    if video:
        unique_filename = f"{uuid.uuid4()}_{video.filename}"
        video_path = f"uploads/videos/{unique_filename}"

        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

    new_product = CraftProduct(
        name=name,
        price=price,
        description=description,
        image_url=image_path,
        video_url=video_path,
        farmer_id=farmer_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Craft product added",
        "data": new_product
    }
    
@router.post("/orders/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):

    product = None

    if order.product_type == "food":
        product = db.query(FoodProduct).filter(FoodProduct.id == order.product_id).first()

    elif order.product_type == "craft":
        product = db.query(CraftProduct).filter(CraftProduct.id == order.product_id).first()

    else:
        raise HTTPException(status_code=400, detail="Invalid product type")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ✅ AUTO farmer_id (IMPORTANT)
    farmer_id = product.farmer_id

    total_price = product.price * order.quantity

    new_order = Order(
        buyer_id=order.buyer_id,
        farmer_id=farmer_id,
        product_type=order.product_type,
        product_id=order.product_id,
        quantity=order.quantity,
        total_price=total_price
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # ✅ Get farmer details
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()

    # ✅ FIX: use already fetched product
    product_name = product.name

    # ✅ Create message
    message = f"""
New Order Received!
Product: {product_name}
Quantity: {order.quantity}
Total: ₹{total_price}
"""

    # ✅ OPTIONAL: language (fallback to English)
    language = getattr(farmer, "language", "en")

    # ✅ Send SMS (with translation support)
    send_sms(farmer.phone, message, language)

    return new_order

@router.get("/buyer/{buyer_id}", response_model=list[OrderResponse])
def get_buyer_orders(buyer_id: int, db: Session = Depends(get_db)):

    orders = db.query(Order).filter(Order.buyer_id == buyer_id).all()

    return orders

@router.get("/farmer/{farmer_id}", response_model=list[OrderResponse])
def get_farmer_orders(farmer_id: int, db: Session = Depends(get_db)):

    orders = db.query(Order).filter(Order.farmer_id == farmer_id).all()

    return orders

@router.post("/organizer-requests", response_model=OrganizerRequestResponse)
def create_request(request: OrganizerRequestCreate, db: Session = Depends(get_db)):

    organizer = db.query(Organizer).filter(Organizer.id == request.organizer_id).first()
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")

    new_request = OrganizerRequest(**request.dict())

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request

# -------------------------------
# GET ALL REQUESTS (for farmers)
# -------------------------------
@router.get("/requests", response_model=list[OrganizerRequestResponse])
def get_all_requests(db: Session = Depends(get_db)):

    return db.query(OrganizerRequest).all()


# -------------------------------
# GET REQUESTS BY ORGANIZER
# -------------------------------
@router.get("/requests/{organizer_id}", response_model=list[OrganizerRequestResponse])
def get_organizer_requests(organizer_id: int, db: Session = Depends(get_db)):

    return db.query(OrganizerRequest).filter(
        OrganizerRequest.organizer_id == organizer_id
    ).all()
    
@router.get("/nearby-farmers")
def get_nearby_farmers(
    address: str,
    radius: float = 10,
    db: Session = Depends(get_db)
):
    from app.utils.geocode import get_lat_lng

    lat, lon = get_lat_lng(address)

    if lat is None:
        raise HTTPException(status_code=400, detail="Invalid address")

    farmers = db.query(Farmer).all()

    nearby = []

    for farmer in farmers:
        if farmer.latitude and farmer.longitude:
            distance = calculate_distance(lat, lon, farmer.latitude, farmer.longitude)

            if distance <= radius:
                nearby.append({
                    "farmer_id": farmer.id,
                    "name": farmer.name,
                    "distance_km": round(distance, 2)
                })

    return nearby


# ============================================================
# PRODUCT LISTING ROUTES (used by Buyer / Admin)
# ============================================================

@router.get("/products/food", response_model=list[FoodProductListResponse])
def get_all_food_products(db: Session = Depends(get_db)):
    products = db.query(FoodProduct).all()
    result = []
    for p in products:
        farmer = db.query(Farmer).filter(Farmer.id == p.farmer_id).first()
        result.append(FoodProductListResponse(
            id=p.id,
            name=p.name,
            price=p.price,
            quantity=p.quantity,
            farmer_id=p.farmer_id,
            farmer_name=farmer.name if farmer else None,
            farm_name=farmer.farm_name if farmer else None,
        ))
    return result


@router.get("/products/craft", response_model=list[CraftProductListResponse])
def get_all_craft_products(db: Session = Depends(get_db)):
    products = db.query(CraftProduct).all()
    result = []
    for p in products:
        farmer = db.query(Farmer).filter(Farmer.id == p.farmer_id).first()
        result.append(CraftProductListResponse(
            id=p.id,
            name=p.name,
            price=p.price,
            description=p.description,
            image_url=p.image_url,
            video_url=p.video_url,
            farmer_id=p.farmer_id,
            farmer_name=farmer.name if farmer else None,
            farm_name=farmer.farm_name if farmer else None,
        ))
    return result


# ============================================================
# ADMIN ROUTES
# ============================================================

@router.post("/register/admin", response_model=AdminResponse)
def register_admin(user: AdminRegister, db: Session = Depends(get_db)):
    if db.query(Admin).filter(Admin.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_admin = Admin(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


@router.get("/admin/all-events", response_model=list[OrganizerRequestResponse])
def admin_get_all_events(db: Session = Depends(get_db)):
    return db.query(OrganizerRequest).all()


@router.get("/admin/nearby-farmers")
def admin_nearby_farmers(
    address: str,
    radius: float = 50,
    db: Session = Depends(get_db)
):
    from app.utils.geocode import get_lat_lng
    lat, lon = get_lat_lng(address)

    if lat is None:
        raise HTTPException(status_code=400, detail="Invalid address")

    farmers = db.query(Farmer).all()
    nearby = []
    for farmer in farmers:
        if farmer.latitude and farmer.longitude:
            distance = calculate_distance(lat, lon, farmer.latitude, farmer.longitude)
            if distance <= radius:
                nearby.append({
                    "farmer_id": farmer.id,
                    "name": farmer.name,
                    "farm_name": farmer.farm_name,
                    "address": farmer.address,
                    "phone": farmer.phone,
                    "distance_km": round(distance, 2)
                })
    return nearby


# ============================================================
# EDIT FOOD PRODUCT PRICE
# ============================================================

@router.put("/food/{product_id}/price", response_model=FoodProductResponse)
def update_food_price(product_id: int, body: FoodPriceUpdate, db: Session = Depends(get_db)):
    product = db.query(FoodProduct).filter(FoodProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Food product not found")

    product.price = body.price
    db.commit()
    db.refresh(product)
    return product


# ============================================================
# FARMER – VIEW ALL OWN PRODUCTS
# ============================================================

@router.get("/farmer/{farmer_id}/products")
def get_farmer_products(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    food_items = db.query(FoodProduct).filter(FoodProduct.farmer_id == farmer_id).all()
    craft_items = db.query(CraftProduct).filter(CraftProduct.farmer_id == farmer_id).all()

    return {
        "food": [
            {
                "id": p.id, "name": p.name,
                "price": p.price, "quantity": p.quantity,
                "farmer_id": p.farmer_id,
            }
            for p in food_items
        ],
        "craft": [
            {
                "id": p.id, "name": p.name,
                "price": p.price, "description": p.description,
                "image_url": p.image_url, "video_url": p.video_url,
                "farmer_id": p.farmer_id,
            }
            for p in craft_items
        ],
    }


# ============================================================
# ADMIN – PRICE SUGGESTIONS
# ============================================================

@router.get("/admin/price-suggestions")
def admin_get_price_suggestions(db: Session = Depends(get_db)):
    suggestions = db.query(PriceSuggestion).order_by(PriceSuggestion.created_at.desc()).all()
    result = []
    for s in suggestions:
        farmer = db.query(Farmer).filter(Farmer.id == s.farmer_id).first()
        result.append({
            "id": s.id,
            "farmer_id": s.farmer_id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "farmer_phone": farmer.phone if farmer else None,
            "product_id": s.product_id,
            "product_name": s.product_name,
            "entered_price": s.entered_price,
            "predicted_price": s.predicted_price,
            "region": s.region,
            "is_acknowledged": s.is_acknowledged,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return result


# ============================================================
# RISK ALERT  –  POST /auth/risk-alert
# ============================================================

@router.post("/risk-alert")
def trigger_risk_alert(body: RiskAlertRequest, db: Session = Depends(get_db)):
    """
    1. Run AI weather risk analysis for the given region + crop.
    2. Persist a RiskEvent row.
    3. SMS farmers IN the affected region   (alert_type = "affected").
    4. Geocode the region; SMS farmers within 1000 km radius
       that haven't already been notified   (alert_type = "nearby").
    5. Return advisory + both notified lists.
    """
    region = body.region.strip()
    crop   = body.crop.strip()

    # ── 1. AI analysis ──────────────────────────────────────────────
    advisory = run_risk_analysis(crop, region)
    if not advisory:
        raise HTTPException(status_code=502, detail="Weather API unavailable")

    weather    = advisory.get("weather", {})
    risk_level = advisory.get("risk_level", "Medium")
    steps      = advisory.get("steps", [])
    steps_text = " | ".join(steps[:2]) if steps else "Monitor weather closely."

    # ── 2. Persist RiskEvent ─────────────────────────────────────────
    risk_event = RiskEvent(
        region       = region,
        crop         = crop,
        risk_level   = risk_level,
        ai_summary   = advisory.get("reason", ""),
        steps        = json.dumps(steps, ensure_ascii=False),
        schemes      = json.dumps(advisory.get("schemes", []), ensure_ascii=False),
        avg_temp     = weather.get("avg_temp"),
        avg_humidity = weather.get("avg_humidity"),
        total_rain   = weather.get("total_rain"),
        conditions   = weather.get("conditions"),
    )
    db.add(risk_event)
    db.commit()
    db.refresh(risk_event)

    all_farmers = db.query(Farmer).all()

    # ── 3. SMS farmers IN the affected region ────────────────────────
    affected_ids = set()
    affected_notified = []

    matched = [
        f for f in all_farmers
        if f.address and region.lower() in f.address.lower()
    ]

    for farmer in matched:
        affected_ids.add(farmer.id)
        language = getattr(farmer, "language", "en") or "en"
        sms_msg  = (
            f"[KrishiSeva Weather Alert] Region: {region} | Crop: {crop}\n"
            f"Risk Level: {risk_level}\n"
            f"Action: {steps_text}\n"
            f"Stay safe and apply government schemes if needed."
        )
        try:
            send_sms(farmer.phone, sms_msg, language)
        except Exception as e:
            print(f"[RiskAlert] SMS failed for farmer {farmer.id}: {e}")

        db.add(RiskAlertLog(
            risk_event_id = risk_event.id,
            farmer_id     = farmer.id,
            farmer_name   = farmer.name,
            phone         = farmer.phone,
            alert_type    = "affected",
            language      = language,
            message_sent  = sms_msg,
        ))
        affected_notified.append({
            "farmer_id": farmer.id,
            "name":      farmer.name,
            "phone":     farmer.phone,
            "language":  language,
        })

    # ── 4. SMS farmers in NEARBY regions (within 1000 km) ────────────
    nearby_notified = []
    NEARBY_RADIUS_KM = 1000

    # Geocode the affected region once
    region_lat, region_lng = get_lat_lng(region)

    if region_lat is not None:
        for farmer in all_farmers:
            if farmer.id in affected_ids:
                continue                          # already notified
            if not (farmer.latitude and farmer.longitude):
                continue                          # no geo data

            dist_km = calculate_distance(
                region_lat, region_lng,
                farmer.latitude, farmer.longitude
            )
            if dist_km > NEARBY_RADIUS_KM:
                continue

            language = getattr(farmer, "language", "en") or "en"
            nearby_msg = (
                f"[KrishiSeva Market Advisory] Nearby region '{region}' has been "
                f"hit by a {risk_level} weather risk for {crop}.\n"
                f"Farmers there may face losses. Demand from their buyers could "
                f"shift toward your area — adjust your prices and production accordingly.\n"
                f"Distance from affected zone: {round(dist_km)} km."
            )
            try:
                send_sms(farmer.phone, nearby_msg, language)
            except Exception as e:
                print(f"[RiskAlert] Nearby SMS failed for farmer {farmer.id}: {e}")

            db.add(RiskAlertLog(
                risk_event_id = risk_event.id,
                farmer_id     = farmer.id,
                farmer_name   = farmer.name,
                phone         = farmer.phone,
                alert_type    = "nearby",
                language      = language,
                message_sent  = nearby_msg,
            ))
            nearby_notified.append({
                "farmer_id": farmer.id,
                "name":      farmer.name,
                "phone":     farmer.phone,
                "language":  language,
                "distance_km": round(dist_km),
            })
    else:
        print(f"[RiskAlert] Could not geocode '{region}' — skipping nearby broadcast.")

    db.commit()

    # ── 5. Return response ───────────────────────────────────────────
    return {
        "risk_event_id":         risk_event.id,
        "region":                region,
        "crop":                  crop,
        "risk_level":            risk_level,
        "reason":                advisory.get("reason"),
        "steps":                 steps,
        "schemes":               advisory.get("schemes", []),
        "weather":               weather,
        "farmers_notified":      affected_notified,      # in the affected region
        "nearby_farmers_notified": nearby_notified,      # within 1000 km
    }


# ============================================================
# ADMIN – LIST ALL RISK ALERTS
# ============================================================

@router.get("/admin/risk-alerts")
def admin_get_risk_alerts(db: Session = Depends(get_db)):
    """Return all RiskEvent rows newest-first with separate affected/nearby counts."""
    events = db.query(RiskEvent).order_by(RiskEvent.created_at.desc()).all()
    result = []
    for ev in events:
        affected_count = (
            db.query(RiskAlertLog)
            .filter(RiskAlertLog.risk_event_id == ev.id,
                    RiskAlertLog.alert_type == "affected")
            .count()
        )
        nearby_count = (
            db.query(RiskAlertLog)
            .filter(RiskAlertLog.risk_event_id == ev.id,
                    RiskAlertLog.alert_type == "nearby")
            .count()
        )
        result.append({
            "id":              ev.id,
            "region":          ev.region,
            "crop":            ev.crop,
            "risk_level":      ev.risk_level,
            "ai_summary":      ev.ai_summary,
            "steps":           ev.steps,
            "schemes":         ev.schemes,
            "avg_temp":        ev.avg_temp,
            "avg_humidity":    ev.avg_humidity,
            "total_rain":      ev.total_rain,
            "conditions":      ev.conditions,
            "affected_count":  affected_count,
            "nearby_count":    nearby_count,
            "farmers_notified": affected_count + nearby_count,  # total (backwards compat)
            "created_at":      ev.created_at.isoformat() if ev.created_at else None,
        })
    return result

