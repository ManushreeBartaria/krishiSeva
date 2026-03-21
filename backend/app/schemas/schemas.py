from pydantic import BaseModel, EmailStr
from typing import Optional

# -------------------------------
# FARMER
# -------------------------------
class FarmerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str]
    address: Optional[str]
    farm_name: str


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