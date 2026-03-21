import time
from sqlalchemy.orm import Session
from app.database.connections import SessionLocal
from app.model.model import Order, Farmer
from app.utils.sms import send_sms


def check_pending_orders():
    db: Session = SessionLocal()

    while True:
        orders = db.query(Order).filter(Order.status == "pending").all()

        for order in orders:
            farmer = db.query(Farmer).filter(Farmer.id == order.farmer_id).first()

            if farmer:
                message = f"New order! Qty: {order.quantity}, Total: ₹{order.total_price}"

                # Send SMS
                send_sms(farmer.phone, message)

                # ✅ Mark as notified
                order.status = "notified"
                db.commit()

        time.sleep(30)  # runs every 30 sec