from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database.connections import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(String(255))
    farm_name = Column(String(100))

class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(String(255))

class Organizer(Base):
    __tablename__ = "organizers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(String(255))
    organization_name = Column(String(100))
    

class FoodProduct(Base):
    __tablename__ = "food_products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(String(50))  # kg, dozen, etc.
    farmer_id = Column(Integer, ForeignKey("farmers.id"))

class CraftProduct(Base):
    __tablename__ = "craft_products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String(255))
    image_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    buyer_id = Column(Integer, ForeignKey("buyers.id"))

    product_type = Column(String(50))  # food / craft
    product_id = Column(Integer)

    farmer_id = Column(Integer, ForeignKey("farmers.id"))

    quantity = Column(Integer)
    total_price = Column(Float)

    status = Column(String(50), default="pending")    
    