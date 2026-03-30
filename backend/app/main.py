from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import weather, aqi, risk, analysis, travel, expenses, map_data, decision

app = FastAPI(
    title="Urban Climate Intelligence API",
    description="Real-time climate monitoring, travel planning, and expense management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(weather.router)
app.include_router(aqi.router)
app.include_router(risk.router)
app.include_router(analysis.router)
app.include_router(travel.router)
app.include_router(expenses.router)
app.include_router(map_data.router)
app.include_router(decision.router)


@app.get("/")
async def root():
    return {
        "name": "Urban Climate Intelligence API",
        "version": "1.0.0",
        "endpoints": [
            "/api/weather?city=Mumbai",
            "/api/weather/coords?lat=19.076&lon=72.877",
            "/api/weather/all",
            "/api/aqi?city=Delhi",
            "/api/risk?city=Chennai",
            "/api/clusters",
            "/api/pca",
            "/api/timeseries?city=Mumbai",
            "/api/insights",
            "/api/travel",
            "/api/itinerary?city=Jaipur&days=3",
            "/api/map-data",
            "/api/cities",
            "/api/expenses",
            "/api/budget",
        ],
    }
