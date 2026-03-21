from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from app.database.connections import Base
from datetime import datetime

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(String(255))
    farm_name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    language = Column(String(50), default="en")

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
    
class OrganizerRequest(Base):
    __tablename__ = "organizer_requests"

    id = Column(Integer, primary_key=True, index=True)

    organizer_id = Column(Integer, ForeignKey("organizers.id"))

    title = Column(String(100))  # short title
    description = Column(String(255))

    place = Column(String(100))
    quantity = Column(Integer)
    budget = Column(Float)

    required_by = Column(DateTime)

    event_type = Column(String(50))  
    # mela / birthday / wedding / bulk

    created_at = Column(DateTime, default=func.current_timestamp())


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))


class PriceSuggestion(Base):
    __tablename__ = "price_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id       = Column(Integer, ForeignKey("farmers.id"))
    product_id      = Column(Integer, ForeignKey("food_products.id"))
    product_name    = Column(String(100))
    entered_price   = Column(Float)
    predicted_price = Column(Float)
    region          = Column(String(100))
    is_acknowledged = Column(String(10), default="no")   # yes / no
    created_at      = Column(DateTime, default=func.current_timestamp())


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id          = Column(Integer, primary_key=True, index=True)
    region      = Column(String(100), nullable=False)
    crop        = Column(String(100), nullable=False)
    risk_level  = Column(String(20))          # Low / Medium / High
    ai_summary  = Column(String(2000))        # full AI reason text
    steps       = Column(String(2000))        # JSON string
    schemes     = Column(String(3000))        # JSON string
    avg_temp    = Column(Float)
    avg_humidity= Column(Float)
    total_rain  = Column(Float)
    conditions  = Column(String(200))
    created_at  = Column(DateTime, default=func.current_timestamp())


class RiskAlertLog(Base):
    __tablename__ = "risk_alert_logs"

    id              = Column(Integer, primary_key=True, index=True)
    risk_event_id   = Column(Integer, ForeignKey("risk_events.id"))
    farmer_id       = Column(Integer, ForeignKey("farmers.id"))
    farmer_name     = Column(String(100))
    phone           = Column(String(20))
    alert_type      = Column(String(20))     # "affected" | "nearby"
    language        = Column(String(20))
    message_sent    = Column(String(2000))
    created_at      = Column(DateTime, default=func.current_timestamp())
