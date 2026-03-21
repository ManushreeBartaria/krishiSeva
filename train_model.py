import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# load dataset
df = pd.read_csv("final_dataset_100_crops.csv")

# encode categorical
df['crop'] = df['crop'].astype('category').cat.codes
df['region'] = df['region'].astype('category').cat.codes

# features & target
X = df[['crop','region','temp','humidity','rain']]
y = df['price']

# train model
model = LinearRegression()
model.fit(X, y)

# save model
joblib.dump(model, "model.pkl")

print("✅ Model trained and saved!")