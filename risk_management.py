import requests
import os
from dotenv import load_dotenv
from groq import Groq

# ---------------- LOAD ENV ----------------
load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)

# ---------------- USER INPUT ----------------
city = input("Enter region/state: ")
crop = input("Enter crop: ")

# ---------------- WEATHER FETCH ----------------
url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"

data = requests.get(url).json()

# error handling (IMPORTANT)
if "main" not in data:
    print("❌ Error fetching weather. Check city name.")
    exit()

temp = data['main']['temp']
humidity = data['main']['humidity']
rain = data.get('rain', {}).get('1h', 0)

print(f"\n🌦️ Weather in {city}:")
print(f"Temp: {temp}°C, Humidity: {humidity}%, Rain: {rain} mm")

# ---------------- AI ANALYSIS ----------------
prompt = f"""
You are an expert agricultural advisor in India.

Analyze:

Crop: {crop}
Region: {city}
Temperature: {temp}°C
Humidity: {humidity}%
Rainfall: {rain} mm

Provide:
1. Risk Level (Low / Medium / High)
2. Reason
3. Suggested actions
4. Government schemes in India
5. Why each scheme is useful
6. Official apply link

Keep response clear and structured.
"""

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": prompt}]
)

result = response.choices[0].message.content

# ---------------- OUTPUT ----------------
print("\n🌾 AI Advisory Output:\n")
print(result)

# ---------------- FINAL DECISION ----------------
text = result.lower()

if "high" in text:
    print("\n🚨 Final Advice: High risk → Use schemes & delay selling")
elif "medium" in text:
    print("\n⚠️ Final Advice: Moderate risk → Take precautions")
else:
    print("\n✅ Final Advice: Safe → You can sell at predicted price")