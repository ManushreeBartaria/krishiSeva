"""
risk_engine.py
Fetches 10-day weather forecast and uses Groq LLM to analyze crop risk.
Returns structured advisory dict with risk_level, steps, govt schemes, etc.
"""
import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
GROQ_API_KEY    = os.getenv("GROQ_API_KEY")


# ── Weather ───────────────────────────────────────────────────────────────────

def fetch_forecast(city: str) -> dict | None:
    """
    Fetches a 5-day / 3-hour forecast from OpenWeatherMap (free tier).
    Returns a dict with avg temp, humidity, rain and a human-readable summary.
    """
    if not WEATHER_API_KEY:
        return None

    url = (
        f"http://api.openweathermap.org/data/2.5/forecast"
        f"?q={city}&appid={WEATHER_API_KEY}&units=metric&cnt=40"
    )
    try:
        data = requests.get(url, timeout=6).json()
    except Exception as e:
        print(f"[RiskEngine] Weather fetch failed: {e}")
        return None

    if "list" not in data:
        return None

    items = data["list"]
    temps     = [i["main"]["temp"]     for i in items]
    humids    = [i["main"]["humidity"] for i in items]
    rains     = [i.get("rain", {}).get("3h", 0) for i in items]
    descs     = list({i["weather"][0]["description"] for i in items[:10]})

    return {
        "city": city,
        "avg_temp":     round(sum(temps)  / len(temps),  1),
        "avg_humidity": round(sum(humids) / len(humids), 1),
        "total_rain":   round(sum(rains), 1),
        "max_temp":     round(max(temps), 1),
        "min_temp":     round(min(temps), 1),
        "conditions":   ", ".join(descs[:4]),
    }


def get_current_weather(city: str) -> dict | None:
    """Fallback: get current weather if forecast fails."""
    if not WEATHER_API_KEY:
        return None
    try:
        url = (
            f"http://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={WEATHER_API_KEY}&units=metric"
        )
        data = requests.get(url, timeout=6).json()
        if "main" not in data:
            return None
        return {
            "city": city,
            "avg_temp":     data["main"]["temp"],
            "avg_humidity": data["main"]["humidity"],
            "total_rain":   data.get("rain", {}).get("1h", 0),
            "max_temp":     data["main"]["temp_max"],
            "min_temp":     data["main"]["temp_min"],
            "conditions":   data["weather"][0]["description"],
        }
    except Exception:
        return None


# ── Groq AI ───────────────────────────────────────────────────────────────────

def analyze_risk(crop: str, city: str, weather: dict) -> dict:
    """
    Calls Groq LLM and returns a structured advisory dict.
    Falls back gracefully if Groq key is missing.
    """
    if not GROQ_API_KEY:
        return _fallback_analysis(crop, city, weather)

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
    except ImportError:
        return _fallback_analysis(crop, city, weather)

    prompt = f"""
You are an expert agricultural advisor in India.

Analyze the following 10-day weather forecast for a farmer:

Crop: {crop}
Region: {city}
Average Temperature: {weather['avg_temp']}°C (max {weather['max_temp']}°C, min {weather['min_temp']}°C)
Average Humidity: {weather['avg_humidity']}%
Total Rainfall forecast: {weather['total_rain']} mm
Weather conditions: {weather['conditions']}

Provide a JSON response with EXACTLY this structure:
{{
  "risk_level": "Low" | "Medium" | "High",
  "reason": "one paragraph explanation",
  "steps": ["step 1", "step 2", "step 3"],
  "schemes": [
    {{"name": "scheme name", "summary": "one line", "link": "https://official-url.gov.in"}},
    {{"name": "scheme name", "summary": "one line", "link": "https://official-url.gov.in"}}
  ]
}}

Only return valid JSON, no other text.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        raw = response.choices[0].message.content.strip()

        # Extract JSON even if surrounded by markdown
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            import json
            result = json.loads(match.group())
            result["raw_response"] = raw
            return result
        return {"risk_level": "Medium", "reason": raw, "steps": [], "schemes": [], "raw_response": raw}

    except Exception as e:
        print(f"[RiskEngine] Groq failed: {e}")
        return _fallback_analysis(crop, city, weather)


def _fallback_analysis(crop: str, city: str, weather: dict) -> dict:
    """Simple rule-based fallback when Groq is unavailable."""
    temp  = weather.get("avg_temp", 25)
    rain  = weather.get("total_rain", 0)
    humid = weather.get("avg_humidity", 60)

    if temp > 40 or rain > 200 or humid > 90:
        level = "High"
        reason = f"Extreme weather conditions detected for {crop} in {city}. Immediate action required."
    elif temp > 35 or rain > 100 or humid > 75:
        level = "Medium"
        reason = f"Moderate weather stress expected for {crop} in {city}. Take precautionary measures."
    else:
        level = "Low"
        reason = f"Weather conditions are generally favourable for {crop} in {city}."

    return {
        "risk_level": level,
        "reason": reason,
        "steps": [
            "Monitor weather updates daily",
            "Ensure appropriate irrigation",
            "Consult local Krishi Vigyan Kendra",
        ],
        "schemes": [
            {
                "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "summary": "Crop insurance to protect farmers from financial losses due to natural calamities.",
                "link": "https://pmfby.gov.in",
            },
            {
                "name": "PM-KISAN",
                "summary": "Direct income support of ₹6000/year to eligible farmer families.",
                "link": "https://pmkisan.gov.in",
            },
        ],
        "raw_response": None,
    }


# ── Convenience: full pipeline ────────────────────────────────────────────────

def run_risk_analysis(crop: str, region: str) -> dict | None:
    """
    Full pipeline: fetch weather → AI analysis → return advisory.
    Returns None if weather fetch completely fails.
    """
    weather = fetch_forecast(region) or get_current_weather(region)
    if not weather:
        # Use static defaults so the route doesn't fully fail
        weather = {
            "city": region,
            "avg_temp": 30.0, "max_temp": 35.0, "min_temp": 25.0,
            "avg_humidity": 65.0, "total_rain": 0.0,
            "conditions": "unknown",
        }

    advisory = analyze_risk(crop, region, weather)
    advisory["weather"] = weather
    return advisory
