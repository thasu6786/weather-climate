import asyncio
from fastapi import APIRouter
from app.config import INDIAN_CITIES, TOURIST_PLACES
from app.services.weather_service import get_all_cities_weather
from app.services.risk_service import calculate_risk_score

router = APIRouter(prefix="/api", tags=["map"])


@router.get("/map-data")
async def map_data():
    """
    Returns all city markers in one fast parallel fetch.
    Weather + AQI are fetched simultaneously inside get_all_cities_weather().
    Risk is computed locally (no I/O) so adding it costs ~0 ms.
    """
    cities_weather = await get_all_cities_weather()

    markers = []
    for w in cities_weather:
        # AQI is already merged into w by get_all_cities_weather()
        aqi_stub = {
            "aqi_index": w.get("aqi_index", 1),
            "label":     w.get("aqi_label", "N/A"),
        }
        risk   = calculate_risk_score(w, aqi_stub)
        places = TOURIST_PLACES.get(w["city"], [])

        markers.append({
            "city":          w["city"],
            "lat":           w["lat"],
            "lon":           w["lon"],
            "temperature":   w["temperature"],
            "humidity":      w["humidity"],
            "rainfall":      w.get("rainfall", 0),
            "condition":     w["main_condition"],
            "aqi":           w.get("aqi", 0),
            "aqi_index":     w.get("aqi_index", 1),
            "aqi_label":     w.get("aqi_label", "N/A"),
            "risk_score":    risk["composite_score"],
            "risk_level":    risk["level"],
            "risk_color":    risk["color"],
            "tourist_places": places[:3],
        })

    return {
        "status": "success",
        "data": {
            "markers": markers,
            "center":  {"lat": 22.0, "lon": 78.0},
            "zoom":    5,
        },
    }


@router.get("/cities")
async def cities():
    return {
        "status": "success",
        "data": [
            {"name": c["name"], "state": c["state"], "lat": c["lat"], "lon": c["lon"]}
            for c in INDIAN_CITIES
        ],
    }
