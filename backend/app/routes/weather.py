from fastapi import APIRouter, Query
from app.services.weather_service import get_weather_by_city, get_weather_by_coords, get_all_cities_weather

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather")
async def weather(city: str = Query(..., description="City name")):
    data = await get_weather_by_city(city)
    return {"status": "success", "data": data}


@router.get("/weather/coords")
async def weather_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    data = await get_weather_by_coords(lat, lon)
    return {"status": "success", "data": data}


@router.get("/weather/all")
async def all_cities_weather():
    data = await get_all_cities_weather()
    return {"status": "success", "data": data, "count": len(data)}
