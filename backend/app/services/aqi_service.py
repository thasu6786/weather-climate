import time
import logging
import asyncio
from typing import Optional

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore

from app.config import OPENWEATHER_API_KEY, API_BASE_URL, CACHE_TTL, INDIAN_CITIES

logger = logging.getLogger(__name__)

_cache: dict = {}

AQI_CATEGORIES = {
    1: {"label": "Good",      "color": "#06D6A0", "health": "Air quality is satisfactory"},
    2: {"label": "Fair",      "color": "#3B82F6", "health": "Acceptable air quality"},
    3: {"label": "Moderate",  "color": "#F59E0B", "health": "May cause discomfort for sensitive groups"},
    4: {"label": "Poor",      "color": "#F97316", "health": "May cause health effects for everyone"},
    5: {"label": "Very Poor", "color": "#EF4444", "health": "Serious health effects for everyone"},
}

POLLUTANT_LABELS = {
    "co": "Carbon Monoxide", "no": "Nitric Oxide", "no2": "Nitrogen Dioxide",
    "o3": "Ozone", "so2": "Sulphur Dioxide", "pm2_5": "PM2.5",
    "pm10": "PM10", "nh3": "Ammonia",
}


def _find_city(name: str):
    for c in INDIAN_CITIES:
        if c["name"].lower() == name.lower():
            return c
    return None


# ── Shared client (imported from weather_service to avoid duplication) ────────

def _get_client() -> "httpx.AsyncClient":
    """Reuse the shared connection-pooled client from weather_service."""
    try:
        from app.services.weather_service import _get_client as _wc
        return _wc()
    except Exception:
        # Fallback: create a local client
        return httpx.AsyncClient(timeout=httpx.Timeout(8.0))


# ── Single city AQI ───────────────────────────────────────────────────────────

async def get_aqi_by_city(city: str) -> dict:
    key = f"aqi_{city}"
    entry = _cache.get(key)
    if entry:
        data, ts = entry
        if time.time() - ts < CACHE_TTL:
            return data

    city_data = _find_city(city)
    if not city_data:
        try:
            from app.services.weather_service import get_weather_by_city
            w = await get_weather_by_city(city)
            if w.get("lat") != 0 or w.get("lon") != 0:
                city_data = {"lat": w["lat"], "lon": w["lon"]}
            else:
                return _empty_aqi(city)
        except Exception:
            return _empty_aqi(city)

    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key_here":
        return _empty_aqi(city)

    if not httpx:
        return _empty_aqi(city)

    try:
        client = _get_client()
        resp = await client.get(
            f"{API_BASE_URL}/data/2.5/air_pollution",
            params={"lat": city_data["lat"], "lon": city_data["lon"], "appid": OPENWEATHER_API_KEY},
        )
        if resp.status_code == 200:
            result = _format_aqi(resp.json(), city, city_data)
            _cache[key] = (result, time.time())
            logger.info(f"[AQI] {city}: index={result['aqi_index']} PM2.5={result['pm25']}")
            return result
        else:
            logger.error(f"[AQI] {resp.status_code} for {city}")
    except Exception as e:
        logger.error(f"[AQI] Exception {city}: {e}")

    return _empty_aqi(city)


async def get_aqi_by_coords(lat: float, lon: float, city_name: str = "Location") -> dict:
    key = f"aqi_{lat}_{lon}"
    entry = _cache.get(key)
    if entry:
        data, ts = entry
        if time.time() - ts < CACHE_TTL:
            return data

    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key_here":
        return _empty_aqi(city_name)

    if not httpx:
        return _empty_aqi(city_name)

    try:
        client = _get_client()
        resp = await client.get(
            f"{API_BASE_URL}/data/2.5/air_pollution",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY},
        )
        if resp.status_code == 200:
            result = _format_aqi(resp.json(), city_name, {"lat": lat, "lon": lon})
            _cache[key] = (result, time.time())
            return result
        else:
            logger.error(f"[AQI] {resp.status_code} for coords {lat},{lon}")
    except Exception as e:
        logger.error(f"[AQI] Exception coords {lat},{lon}: {e}")

    return _empty_aqi(city_name)


# ── Parallel AQI for all cities ───────────────────────────────────────────────

async def get_all_cities_aqi() -> list:
    """Fetch AQI for all Indian cities in one parallel gather."""
    tasks = [get_aqi_by_city(c["name"]) for c in INDIAN_CITIES]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r if isinstance(r, dict) else _empty_aqi("unknown") for r in results]


# ── Formatters ────────────────────────────────────────────────────────────────

def _format_aqi(raw: dict, city: str, city_data: dict) -> dict:
    item       = raw.get("list", [{}])[0]
    aqi_index  = item.get("main", {}).get("aqi", 1)
    components = item.get("components", {})
    cat        = AQI_CATEGORIES.get(aqi_index, AQI_CATEGORIES[1])

    pollutants = [
        {"name": POLLUTANT_LABELS.get(k, k), "key": k, "value": round(v, 2)}
        for k, v in components.items()
    ]

    return {
        "city":          city,
        "aqi_index":     aqi_index,
        "label":         cat["label"],
        "color":         cat["color"],
        "health_impact": cat["health"],
        "pollutants":    pollutants,
        "pm25":          round(components.get("pm2_5", 0), 2),
        "pm10":          round(components.get("pm10", 0), 2),
        "o3":            round(components.get("o3", 0), 2),
        "no2":           round(components.get("no2", 0), 2),
    }


def _empty_aqi(city: str) -> dict:
    return {
        "city": city, "aqi_index": 0, "label": "N/A",
        "color": "#65657A", "health_impact": "Data unavailable",
        "pollutants": [], "pm25": 0, "pm10": 0, "o3": 0, "no2": 0,
    }
