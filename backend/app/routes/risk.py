from fastapi import APIRouter, Query
from app.services.weather_service import get_weather_by_city
from app.services.aqi_service import get_aqi_by_city
from app.services.risk_service import calculate_risk_score

router = APIRouter(prefix="/api", tags=["risk"])


@router.get("/risk")
async def risk(city: str = Query(..., description="City name")):
    weather = await get_weather_by_city(city)
    aqi = await get_aqi_by_city(city)
    risk_data = calculate_risk_score(weather, aqi)
    return {
        "status": "success",
        "data": {
            "city": city,
            "weather_summary": {
                "temperature": weather["temperature"],
                "humidity": weather["humidity"],
                "condition": weather["main_condition"],
            },
            "aqi_summary": {
                "index": aqi["aqi_index"],
                "label": aqi["label"],
            },
            **risk_data,
        },
    }
