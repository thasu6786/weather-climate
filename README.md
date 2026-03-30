# 🌦️ Urban Climate Intelligence Platform

A full-stack web application for real-time climate monitoring, weather analytics, travel planning, and expense management across major Indian cities.

## 🚀 Features

- **Real-Time Weather Dashboard** — Live weather data for 20+ Indian cities via OpenWeather API
- **Air Quality Index (AQI)** — Monitor pollution levels and health risk assessments
- **Interactive Map** — Leaflet-powered map with weather overlays and city markers
- **Climate Analytics** — Clustering, PCA analysis, and time-series visualizations
- **Smart Travel Planner** — Weather-aware itinerary generation with tourist recommendations
- **Expense Tracker** — Budget management and travel expense tracking
- **Decision Engine** — AI-powered climate-based decision support

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **FastAPI** (Python)
- **OpenWeather API** for real-time weather data
- **scikit-learn** for clustering & PCA analysis
- **Pandas / NumPy** for data processing
- **httpx** for async HTTP requests

## 📋 Prerequisites

- **Node.js** (v18+)
- **Python** (3.10+)
- **OpenWeather API Key** — [Get one free](https://openweathermap.org/api)

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/thasu6786/Weather-Climate-Project-.git
cd Weather-Climate-Project-
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Configuration & city data
│   │   ├── models/              # Pydantic data models
│   │   ├── routes/              # API route handlers
│   │   │   ├── weather.py       # Weather endpoints
│   │   │   ├── aqi.py           # Air quality endpoints
│   │   │   ├── risk.py          # Climate risk assessment
│   │   │   ├── analysis.py      # Clustering & PCA
│   │   │   ├── travel.py        # Travel planning
│   │   │   ├── expenses.py      # Expense management
│   │   │   ├── map_data.py      # Map data endpoints
│   │   │   └── decision.py      # Decision engine
│   │   └── services/            # Business logic services
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── App.jsx              # Root component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔗 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/weather?city=Mumbai` | Weather for a specific city |
| `GET /api/weather/all` | Weather for all tracked cities |
| `GET /api/aqi?city=Delhi` | Air quality index |
| `GET /api/risk?city=Chennai` | Climate risk assessment |
| `GET /api/clusters` | City clustering analysis |
| `GET /api/pca` | PCA dimensionality reduction |
| `GET /api/timeseries?city=Mumbai` | Time-series weather data |
| `GET /api/insights` | Climate insights & analytics |
| `GET /api/travel` | Travel recommendations |
| `GET /api/itinerary?city=Jaipur&days=3` | Auto-generated itinerary |
| `GET /api/map-data` | Map overlay data |
| `GET /api/expenses` | Expense records |
| `GET /api/budget` | Budget summary |

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
