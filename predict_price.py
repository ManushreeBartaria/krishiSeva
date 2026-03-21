import joblib
import requests
import os
import pandas as pd
from dotenv import load_dotenv

# load env
load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")

# load model
model = joblib.load("model.pkl")

# load dataset (for encoding)
df = pd.read_csv("final_dataset_100_crops.csv")

# user input
crop_input = input("Enter crop: ").lower()
state_input = input("Enter state: ")

# encoding (IMPORTANT)
crop_map = {v: k for k, v in enumerate(df['crop'].astype('category').cat.categories)}
region_map = {v: k for k, v in enumerate(df['region'].astype('category').cat.categories)}

crop_code = crop_map.get(crop_input, 0)
region_code = region_map.get(state_input, 0)

# get weather
url = f"http://api.openweathermap.org/data/2.5/weather?q={state_input}&appid={API_KEY}&units=metric"
data = requests.get(url).json()

temp = data['main']['temp']
humidity = data['main']['humidity']
rain = data.get('rain', {}).get('1h', 0)

# prediction
pred = model.predict([[crop_code, region_code, temp, humidity, rain]])

print(f"\n📈 Predicted price of {crop_input} in {state_input}: ₹{round(pred[0],2)}")