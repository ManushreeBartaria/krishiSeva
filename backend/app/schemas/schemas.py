from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# -------------------------------
# FARMER
# -------------------------------
class FarmerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str]
    address: str
    farm_name: str
    language: str

class FarmerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]
    farm_name: Optional[str]

    class Config:
        from_attributes = True


# -------------------------------
# BUYER
# -------------------------------
class BuyerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str]
    address: Optional[str]


class BuyerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True


# -------------------------------
# ORGANIZER
# -------------------------------
class OrganizerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str]
    address: Optional[str]
    organization_name: str


class OrganizerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]
    organization_name: Optional[str]

    class Config:
        from_attributes = True
        
class FoodProductCreate(BaseModel):
    name: str
    price: float
    quantity: Optional[str]


class FoodProductResponse(FoodProductCreate):
    id: int
    farmer_id: int

    class Config:
        from_attributes = True


# -------------------------------
# CRAFT PRODUCT
# -------------------------------
class CraftProductCreate(BaseModel):
    name: str
    price: float
    description: Optional[str]

    # NEW
    image_url: Optional[str]
    video_url: Optional[str]


class CraftProductResponse(CraftProductCreate):
    id: int
    farmer_id: int

    class Config:
        from_attributes = True     
        

class OrderCreate(BaseModel):
    buyer_id: int
    product_type: str   # "food" or "craft"
    product_id: int
    quantity: int


class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    farmer_id: int
    product_type: str
    product_id: int
    quantity: int
    total_price: float
    status: str

    class Config:
        from_attributes = True        
        
class OrganizerRequestCreate(BaseModel):
    organizer_id: int
    title: str
    description: str
    place: str
    quantity: int
    budget: float
    required_by: datetime
    event_type: str   # mela / birthday / wedding / bulk


class OrganizerRequestResponse(OrganizerRequestCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------------
# ADMIN
# -------------------------------
class AdminRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str]


class AdminResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]

    class Config:
        from_attributes = True


# -------------------------------
# PRODUCT LISTING (for buyers/admin)
# -------------------------------
class FoodProductListResponse(BaseModel):
    id: int
    name: str
    price: float
    quantity: Optional[str]
    farmer_id: int
    farmer_name: Optional[str] = None
    farm_name: Optional[str] = None

    class Config:
        from_attributes = True


class CraftProductListResponse(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    farmer_id: int
    farmer_name: Optional[str] = None
    farm_name: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------------
# PRICE SUGGESTION (admin alert)
# -------------------------------
class PriceSuggestionResponse(BaseModel):
    id: int
    farmer_id: int
    product_id: int
    product_name: str
    entered_price: float
    predicted_price: float
    region: Optional[str]
    is_acknowledged: str
    created_at: datetime
    farmer_name: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------------
# PRICE EDIT
# -------------------------------
class FoodPriceUpdate(BaseModel):
    price: float


# -------------------------------
# FARMER PRODUCT LISTING
# -------------------------------
class FarmerFoodItem(BaseModel):
    id: int
    name: str
    price: float
    quantity: Optional[str]
    farmer_id: int

    class Config:
        from_attributes = True


class FarmerCraftItem(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    farmer_id: int

    class Config:
        from_attributes = True


# -------------------------------
# RISK ALERT
# -------------------------------
class RiskAlertRequest(BaseModel):
    region: str
    crop: str


class RiskAlertAdminRow(BaseModel):
    id: int
    region: str
    crop: str
    risk_level: Optional[str]
    ai_summary: Optional[str]
    steps: Optional[str]       # JSON string
    schemes: Optional[str]     # JSON string
    avg_temp: Optional[float]
    avg_humidity: Optional[float]
    total_rain: Optional[float]
    conditions: Optional[str]
    farmers_notified: int = 0
    created_at: Optional[datetime]

    class Config:
        from_attributes = True