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

# ── In-memory cache ──────────────────────────────────────────────────────────
_cache: dict = {}

# ── Shared async HTTP client (connection-pooled, reused across requests) ─────
_client: Optional["httpx.AsyncClient"] = None

def _get_client() -> "httpx.AsyncClient":
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(8.0),          # 8 s total timeout
            limits=httpx.Limits(
                max_connections=40,              # up to 40 concurrent
                max_keepalive_connections=20,
            ),
        )
    return _client


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry:
        data, ts = entry
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def _set_cache(key: str, data):
    _cache[key] = (data, time.time())


def _find_city(name: str):
    for c in INDIAN_CITIES:
        if c["name"].lower() == name.lower():
            return c
    return None


# ── Single city weather ──────────────────────────────────────────────────────

async def get_weather_by_city(city: str) -> dict:
    cached = _get_cached(f"weather_{city}")
    if cached:
        return cached

    city_data = _find_city(city)

    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key_here":
        logger.warning(f"[Weather] No valid API key — using empty data for {city}")
        return _empty_weather(city, city_data)

    if not httpx:
        return _empty_weather(city, city_data)

    try:
        client = _get_client()
        if city_data:
            params = {"lat": city_data["lat"], "lon": city_data["lon"],
                      "appid": OPENWEATHER_API_KEY, "units": "metric"}
        else:
            params = {"q": f"{city},IN", "appid": OPENWEATHER_API_KEY, "units": "metric"}

        resp = await client.get(f"{API_BASE_URL}/data/2.5/weather", params=params)

        if resp.status_code == 200:
            result = _format_weather(resp.json(), city_data or {})
            _set_cache(f"weather_{city}", result)
            logger.info(f"[Weather] {city}: {result['temperature']}°C")
            return result
        else:
            logger.error(f"[Weather] {resp.status_code} for {city}")
    except Exception as e:
        logger.error(f"[Weather] Exception {city}: {e}")

    return _empty_weather(city, city_data)


async def get_weather_by_coords(lat: float, lon: float) -> dict:
    cached = _get_cached(f"weather_{lat}_{lon}")
    if cached:
        return cached

    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key_here":
        return _empty_weather("Your Location")

    if not httpx:
        return _empty_weather("Your Location")

    try:
        client = _get_client()
        resp = await client.get(
            f"{API_BASE_URL}/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
        )
        if resp.status_code == 200:
            result = _format_weather(resp.json(), {"lat": lat, "lon": lon, "state": ""})
            _set_cache(f"weather_{lat}_{lon}", result)
            return result
    except Exception as e:
        logger.error(f"[Weather] Coords exception: {e}")

    return _empty_weather("Your Location", {"lat": lat, "lon": lon, "state": "India"})


async def search_locations(query: str) -> list:
    """Uses OpenWeather Geocoding API to predict locations"""
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweather_api_key_here":
        return []
    if not httpx:
        return []

    try:
        client = _get_client()
        resp = await client.get(
            f"{API_BASE_URL}/geo/1.0/direct",
            params={"q": query, "limit": 5, "appid": OPENWEATHER_API_KEY},
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"[Geocode] Exception for {query}: {e}")
    return []



# ── ALL cities — parallel fetch ──────────────────────────────────────────────

async def get_all_cities_weather() -> list:
    """
    Fetch weather for all Indian cities in parallel using asyncio.gather.
    Falls back to cached values for any failed cities.
    """
    from app.services.aqi_service import get_aqi_by_city

    # Check if we have a full-batch cache hit
    batch_cache = _get_cached("all_cities_weather")
    if batch_cache:
        logger.info("[Weather] All-cities cache hit")
        return batch_cache

    city_names = [c["name"] for c in INDIAN_CITIES]

    # Fetch weather + AQI for all cities simultaneously
    weather_tasks = [get_weather_by_city(name) for name in city_names]
    aqi_tasks     = [get_aqi_by_city(name) for name in city_names]

    # Run both batches in parallel
    weather_results, aqi_results = await asyncio.gather(
        asyncio.gather(*weather_tasks, return_exceptions=True),
        asyncio.gather(*aqi_tasks,     return_exceptions=True),
    )

    results = []
    for w, a in zip(weather_results, aqi_results):
        if isinstance(w, Exception):
            logger.error(f"[Weather] Batch error: {w}")
            continue

        # Merge AQI into weather dict
        if isinstance(a, Exception) or not isinstance(a, dict):
            w["aqi"]       = 0
            w["aqi_index"] = 1
            w["aqi_label"] = "N/A"
        else:
            w["aqi"]       = a.get("pm25", 0)
            w["aqi_index"] = a.get("aqi_index", 1)
            w["aqi_label"] = a.get("label", "Good")

        results.append(w)

    # Cache the whole batch
    _set_cache("all_cities_weather", results)
    logger.info(f"[Weather] Parallel fetch complete: {len(results)} cities")
    return results


# ── Formatters ───────────────────────────────────────────────────────────────

def _format_weather(raw: dict, city_data: dict) -> dict:
    main    = raw.get("main", {})
    wind    = raw.get("wind", {})
    weather = raw.get("weather", [{}])[0]
    return {
        "city":          raw.get("name", "Unknown"),
        "lat":           city_data.get("lat", raw.get("coord", {}).get("lat", 0)),
        "lon":           city_data.get("lon", raw.get("coord", {}).get("lon", 0)),
        "state":         city_data.get("state", ""),
        "temperature":   round(main.get("temp", 0), 1),
        "feels_like":    round(main.get("feels_like", 0), 1),
        "temp_min":      round(main.get("temp_min", 0), 1),
        "temp_max":      round(main.get("temp_max", 0), 1),
        "humidity":      main.get("humidity", 0),
        "pressure":      main.get("pressure", 0),
        "wind_speed":    round(wind.get("speed", 0), 1),
        "wind_deg":      wind.get("deg", 0),
        "visibility":    raw.get("visibility", 10000),
        "clouds":        raw.get("clouds", {}).get("all", 0),
        "rainfall":      raw.get("rain", {}).get("1h", 0) if "rain" in raw else 0,
        "description":   weather.get("description", "clear sky"),
        "icon":          weather.get("icon", "01d"),
        "main_condition": weather.get("main", "Clear"),
    }


def _empty_weather(city: str, city_data: Optional[dict] = None) -> dict:
    return {
        "city":          city,
        "lat":           city_data.get("lat", 0) if city_data else 0,
        "lon":           city_data.get("lon", 0) if city_data else 0,
        "state":         city_data.get("state", "") if city_data else "",
        "temperature":   0,
        "feels_like":    0,
        "temp_min":      0,
        "temp_max":      0,
        "humidity":      0,
        "pressure":      0,
        "wind_speed":    0,
        "wind_deg":      0,
        "visibility":    0,
        "clouds":        0,
        "rainfall":      0,
        "description":   "unavailable",
        "icon":          "01d",
        "main_condition": "Clear",
    }
