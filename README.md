# 🌾 KrishiSeva — Empowering Indian Farmers Through Technology

<div align="center">

![KrishiSeva Banner](https://img.shields.io/badge/KrishiSeva-Farmer%20First-green?style=for-the-badge&logo=leaf)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5+-purple?style=flat-square&logo=vite)

**A full-stack agri-tech platform connecting farmers, buyers, and organizers — with AI-powered risk management, real-time SMS alerts in regional languages, and a marketplace that champions rural livelihoods.**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)

---

## 🌍 Overview

KrishiSeva bridges the gap between Indian farmers and the market. Farmers can sell food produce and handcrafted goods, receive AI-driven price guidance, and get real-time weather risk alerts in their native language — all in one platform.

The platform supports **four roles**: Farmers, Buyers, Organizers (event coordinators), and Admins — each with their own dashboard and capabilities.

---

## ✨ Features

### 🛒 Marketplace

#### 🥦 Food Products
- Farmers list fresh produce with price and quantity
- Buyers browse and order directly from nearby farmers
- Automatic order confirmation SMS sent to the farmer in their regional language

#### 🧵 Craft Products — *Empowering Rural Women*
- Dedicated section for **handcrafted goods**: pottery, textiles, embroidery, jewellery, and more
- Farmers (especially **women artisans and self-help group members**) can upload photos and demo videos of their crafts
- Enables rural women entrepreneurs to reach a pan-India buyer base without middlemen
- Every craft listing showcases the maker's story — turning tradition into livelihood
- Supports **women empowerment** by giving artisans a digital storefront, fair pricing control, and direct income

---

### 💰 AI-Powered Price Prediction

- Machine learning model trained on historical market price data predicts fair crop prices
- When a farmer lists a product **below the predicted market rate**, they are automatically:
  - Sent an **SMS alert** (in their language) advising a price correction
  - Logged in the admin panel as a price-suggestion case
- Admins can review all under-priced listings in the **Price Suggestions** tab
- Helps farmers avoid exploitation and earn what their crops are truly worth

---

### 🌦️ Weather Risk Management & Alert System

The most powerful feature — a complete pipeline from climate data to farmer action:

#### How it works:
1. Admin selects a **region** and **crop** in the admin portal
2. The system fetches a **10-day weather forecast** (OpenWeatherMap)
3. **Groq LLM (Llama 3)** analyzes the forecast and generates:
   - Risk Level: `Low` / `Medium` / `High`
   - AI-written reason / explanation
   - Recommended action steps for the farmer
   - Applicable **Government of India schemes** with official apply links
4. Two waves of **SMS notifications** are sent automatically:

   | Group | Who Gets It | Message |
   |---|---|---|
   | 🚨 **Affected** | Farmers in the exact region | Weather risk alert + action steps + govt schemes |
   | 📡 **Nearby** | All farmers within **1000 km** radius | Market advisory: *demand may shift your way — adjust prices & production* |

5. Every notification is **translated into the farmer's registered regional language** (Hindi, Marathi, Telugu, Tamil, etc.) before sending
6. All events and notifications are persisted in the database and viewable under the **Risk Alerts** admin tab

#### Admin Portal View:
- Run a new analysis via the **Analyze & Notify** form
- See full advisory card: risk badge, weather snapshot, AI reason, action steps, scheme cards
- Browse **Past Risk Alerts** table with expandable rows
- Separate **Affected** (🔴) and **Nearby** (🔵) farmer counts per alert

---

### 🗺️ Nearby Farmer Discovery

- Buyers can search for farmers near them using their address
- Uses **geocoding + Haversine distance** calculation
- Results show farmer name, farm name, address, phone, and distance in km
- Encourages hyperlocal commerce and reduces supply-chain intermediaries

---

### 📅 Organizer Event Requests

- Organizers (wedding planners, mela organizers, corporate caterers) can post produce-requirement requests
- Farmers see all active requests and can approach organizers directly
- Event types: Mela, Wedding, Birthday, Corporate, Bulk, and more
- Admins can monitor all events from the portal

---

### 📱 Multilingual SMS Notifications

Every SMS sent in this platform is:
1. Composed in English
2. **Auto-translated** to the farmer's registered language using `deep-translator` (Google Translate)
3. Sent via the configured SMS gateway

Supported languages: Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Punjabi, and any language supported by Google Translate.

---

### 🛡️ Admin Portal

A powerful operations dashboard with:

| Tab | Purpose |
|---|---|
| 📍 Nearby Farmers | Search by location + radius to find registered farmers |
| 📋 Organizer Events | View all event requirement requests |
| 💡 Price Suggestions | Review farmers who listed below ML-suggested prices |
| 🌦️ Risk Alerts | Run weather risk analysis, view past alerts, see all SMS logs |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | Python 3.10+, FastAPI |
| **Database** | MySQL (via SQLAlchemy ORM) |
| **ML Model** | Scikit-learn (price prediction) |
| **AI / LLM** | Groq API — Llama 3.1 8B Instant |
| **Weather** | OpenWeatherMap API (5-day forecast) |
| **Translation** | deep-translator (Google Translate) |
| **SMS** | Custom SMS gateway (HTTP API) |
| **Geocoding** | Nominatim / OpenStreetMap |

---

## 📁 Project Structure

```
krishiSeva/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # All API endpoints
│   │   ├── database/
│   │   │   └── connections.py     # SQLAlchemy DB setup
│   │   ├── model/
│   │   │   └── model.py           # ORM models (Farmer, Buyer, Order, RiskEvent…)
│   │   ├── schemas/
│   │   │   └── schemas.py         # Pydantic request/response schemas
│   │   ├── services/
│   │   └── utils/
│   │       ├── geocode.py         # Address → lat/lng
│   │       ├── locations.py       # Haversine distance
│   │       ├── price_predictor.py # ML price prediction
│   │       ├── risk_engine.py     # Weather fetch + Groq AI analysis
│   │       ├── security.py        # Password hashing
│   │       ├── sms.py             # SMS gateway integration
│   │       └── translate.py       # Google Translate wrapper
│   └── main.py
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── api.js             # Axios API layer
│       ├── components/
│       │   └── Navbar.jsx
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── admin/AdminDashboard.jsx
│       │   ├── farmer/FarmerDashboard.jsx
│       │   ├── buyer/BuyerDashboard.jsx
│       │   └── organizer/OrganizerDashboard.jsx
│       ├── App.jsx
│       └── index.css
│
├── risk_management.py             # Standalone CLI risk tool (prototype)
├── model.pkl                      # Trained price prediction model
├── final_dataset_100_crops.csv
├── requirements.txt
└── .env
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL server
- API keys for OpenWeatherMap and Groq

### 1. Clone the repository
```bash
git clone https://github.com/ManushreeBartaria/krishiSeva.git
cd krishiSeva
```

### 2. Backend setup
```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the backend server
Set-Location backend
uvicorn main:app --reload
```

The API will be live at `http://127.0.0.1:8000`
Interactive docs at `http://127.0.0.1:8000/docs`

### 3. Frontend setup
```powershell
Set-Location ..\frontend

# Install node dependencies
npm install

# Start development server
npm run dev
```

The app will be live at `http://localhost:5173`

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
WEATHER_API_KEY=your_openweathermap_api_key
GROQ_API_KEY=your_groq_api_key
```

> Configure your MySQL connection string in `backend/app/database/connections.py`

---

## 📡 API Reference

All routes are prefixed with `/auth`.

### Authentication & Registration
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register/farmer` | Register a new farmer |
| `POST` | `/auth/register/buyer` | Register a new buyer |
| `POST` | `/auth/register/organizer` | Register a new organizer |
| `POST` | `/auth/register/admin` | Register a new admin |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/food/{farmer_id}` | Add food product (triggers ML price check + SMS) |
| `POST` | `/auth/craft/{farmer_id}` | Add craft product (with image/video upload) |
| `GET` | `/auth/products/food` | List all food products |
| `GET` | `/auth/products/craft` | List all craft products |
| `GET` | `/auth/farmer/{farmer_id}/products` | Get a farmer's own listings |
| `PUT` | `/auth/food/{product_id}/price` | Update food product price |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/orders/` | Create order (triggers farmer SMS notification) |
| `GET` | `/auth/buyer/{buyer_id}` | Get buyer's orders |
| `GET` | `/auth/farmer/{farmer_id}` | Get farmer's received orders |

### Organizer
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/organizer-requests` | Create event request |
| `GET` | `/auth/requests` | List all requests |
| `GET` | `/auth/requests/{organizer_id}` | Get requests by organizer |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/admin/all-events` | All organizer events |
| `GET` | `/auth/admin/nearby-farmers` | Search farmers by location |
| `GET` | `/auth/admin/price-suggestions` | View all ML price alerts |
| `POST` | `/auth/risk-alert` | Run weather risk analysis + SMS broadcast |
| `GET` | `/auth/admin/risk-alerts` | List all past risk alerts |

### Discovery
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/nearby-farmers` | Find farmers near a buyer |

---

## 👥 User Roles

### 🌾 Farmer
- Register with address, farm name, and preferred language
- List food produce and craft products
- Receive SMS alerts for: new orders, under-pricing warnings, weather risks
- View all received orders

### 🛍️ Buyer
- Browse food and craft products from farmers across India
- Search for farmers nearby
- Place orders directly with farmers

### 🎪 Organizer
- Post bulk produce requirements for events (melas, weddings, corporate gatherings)
- Farmers can see and respond to these requirements

### 🛡️ Admin
- Oversee the entire marketplace
- Trigger weather risk analysis for any region/crop
- Monitor price suggestions, organizer events, and risk alert history
- View all SMS notifications sent

---

## 🌱 Social Impact

- **Financial inclusion**: Farmers earn fair prices guided by market ML models
- **Women empowerment**: Craft product marketplace gives rural women artisans a direct income stream and national visibility
- **Climate resilience**: AI + weather data warns farmers about upcoming risks before they occur
- **Market intelligence**: Nearby farmers automatically receive market advisories when a region faces a crisis, helping them capitalise on demand shifts
- **Language accessibility**: Every alert is delivered in the farmer's native language, reaching the last mile

---

## 📜 License

This project is developed for educational and social impact purposes.

---

<div align="center">
Made with ❤️ for India's farming community · <strong>KrishiSeva</strong>
</div>
