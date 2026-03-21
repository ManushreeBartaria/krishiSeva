"""
price_predictor.py
Wraps the trained LinearRegression model.
Called when a food product is added, to check if the farmer's price is below market.
"""  # v2 — reloaded after joblib/pandas installed

import os
import joblib
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

# ─── Paths ───────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# backend/  (the app/ parent)
_BACKEND_DIR = _BASE
_MODEL_PATH  = os.path.join(_BACKEND_DIR, "model.pkl")
_CSV_PATH    = os.path.join(os.path.dirname(_BACKEND_DIR), "final_dataset_100_crops.csv")

# ─── Lazy-load model & encoding maps ─────────────────────────────────────────
_model     = None
_crop_map  = None
_region_map = None

def _load():
    global _model, _crop_map, _region_map
    if _model is not None:
        return

    if not os.path.exists(_MODEL_PATH):
        print(f"[PricePredictor] model.pkl not found at {_MODEL_PATH} — skipping predictions.")
        return

    try:
        _model = joblib.load(_MODEL_PATH)
        df = pd.read_csv(_CSV_PATH)
        _crop_map   = {v: k for k, v in enumerate(df['crop'].astype('category').cat.categories)}
        _region_map = {v: k for k, v in enumerate(df['region'].astype('category').cat.categories)}
    except Exception as e:
        print(f"[PricePredictor] Failed to load model: {e}")
        _model = None


def _get_weather(location: str):
    """Fetch temp, humidity, rain from OpenWeatherMap. Falls back to average values."""
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return 30.0, 60.0, 0.0   # dataset average fallback

    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
        data = requests.get(url, timeout=4).json()
        temp     = data['main']['temp']
        humidity = data['main']['humidity']
        rain     = data.get('rain', {}).get('1h', 0.0)
        return float(temp), float(humidity), float(rain)
    except Exception:
        return 30.0, 60.0, 0.0   # fallback on error


def get_predicted_price(crop_name: str, location: str) -> float | None:
    """
    Returns ML-predicted price for the crop at the given location.
    Returns None if model is unavailable or crop is unknown.
    """
    _load()
    if _model is None:
        return None

    crop_key   = crop_name.strip().lower()
    region_key = location.strip()

    crop_code   = _crop_map.get(crop_key)
    region_code = _region_map.get(region_key)

    if crop_code is None or region_code is None:
        # Try case-insensitive region match
        for k, v in _region_map.items():
            if k.lower() == region_key.lower():
                region_code = v
                break
        for k, v in _crop_map.items():
            if k.lower() == crop_key:
                crop_code = v
                break

    if crop_code is None:
        return None   # crop not in training data — skip

    if region_code is None:
        region_code = 0  # fallback to 0 for unknown regions

    temp, humidity, rain = _get_weather(location)

    try:
        pred = _model.predict([[crop_code, region_code, temp, humidity, rain]])
        return round(float(pred[0]), 2)
    except Exception as e:
        print(f"[PricePredictor] Prediction failed: {e}")
        return None
