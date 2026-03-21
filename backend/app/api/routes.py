# (itertools.product not needed)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connections import get_db
from app.model.model import Farmer, Buyer, Organizer, FoodProduct, CraftProduct, Order, OrganizerRequest, Admin
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
)
from app.utils.security import hash_password
from fastapi import File, UploadFile, Form
import shutil
import os
import uuid
from app.utils.geocode import get_lat_lng
from app.utils.locations import calculate_distance
from app.model.model import Farmer
from app.utils.sms import send_sms
from app.model.model import Farmer


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