from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connections import engine
from app.model import model
from app.api.routes import router as auth_router
from fastapi.staticfiles import StaticFiles
from app.services.order_checker import check_pending_orders



app = FastAPI(
    title="KrishiSeva API 🌾",
    description="Farmer-User Marketplace Backend",
    version="1.0.0"
)
model.Base.metadata.create_all(bind=engine)
origins=["http://localhost:3000", "http://127.0.0.1:3000"]  
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth_router)
import threading
from app.services.order_checker import check_pending_orders

@app.on_event("startup")
def start_background_task():
    thread = threading.Thread(target=check_pending_orders, daemon=True)
    thread.start()

@app.get("/")
def root():
    return {
        "message": "KrishiSeva Backend Running 🚀",
        "docs": "/docs"
    }
