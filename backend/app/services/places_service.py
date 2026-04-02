import os
import json
import httpx
import logging
import asyncio
from app.config import GOOGLE_MAPS_API_KEY, OPENAI_API_KEY

logger = logging.getLogger(__name__)

CACHE_FILE = "places_cache.json"

def _load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_cache(cache):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save places cache: {e}")

_cache = _load_cache()


async def _get_openai_curated_places(location: str, travel_type: str, limit: int = 10) -> list:
    """Uses OpenAI to perfectly generate hyper-specific names of tourist attractions."""
    if not OPENAI_API_KEY:
        logger.warning("[OPENAI] No API Key found.")
        return []

    prompt = f"""You are a professional travel architect building a premium trip for a User.
The user wants {limit} highly rated, distinct {travel_type} in the location: {location}.
Rules:
1. ONLY return the exact official names of the attractions/places. Do not include their city name or descriptors unless necessary.
2. Provide a pure JSON array of strings. No markdown backticks, no markdown json block, no extra text. Just the array.
Example Output: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"]"""

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are a specialized JSON-output data extraction AI."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=15.0
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                
                # Sanitize response in case it returns backticks
                content = content.replace("```json", "").replace("```", "").strip()
                
                places_list = json.loads(content)
                if isinstance(places_list, list):
                    logger.info(f"[OPENAI] Successfully curated places: {places_list}")
                    return places_list
            else:
                logger.error(f"[OPENAI] API Error {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"[OPENAI] Exception: {e}")

    return []

async def fetch_tourist_places(location: str, travel_type: str = "tourist attractions") -> list:
    """
    Fetch top tourist places using a Dual-AI Approach:
    1. OpenAI curates the perfect specific names.
    2. Google Places API resolves their precise locations and global ratings.
    Utilizes local JSON caching to avoid massive recursive billing.
    """
    cache_key = f"{location.lower().strip()}_{travel_type.lower().strip()}"

    if cache_key in _cache:
        logger.info(f"[PLACES] Cache hit for: {cache_key}")
        return _cache[cache_key]

    if not GOOGLE_MAPS_API_KEY:
        logger.warning("[PLACES] No GOOGLE_MAPS_API_KEY found, falling back to mock data.")
        return _get_mock_places(location, travel_type)

    # 1. Gather curated names via OpenAI
    curated_names = await _get_openai_curated_places(location, travel_type, limit=8)
    
    if not curated_names:
        # Fallback to pure geographic search if OpenAI fails
        logger.info("[PLACES] OpenAI empty. Falling back to simple Google query.")
        curated_names = [f"top {travel_type} in {location}"]

    places = []
    
    # 2. Parallelize Google Places queries for the curated names to resolve exact geographical data
    async def fetch_exact_place(client, place_name):
        query = f"{place_name} in {location}"
        try:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={
                    "query": query,
                    "key": GOOGLE_MAPS_API_KEY,
                },
                timeout=10.0
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    r = results[0] # Take the absolute highest match
                    
                    # Ignore businesses or random streets that sneaked in
                    if r.get("rating", 0) < 3.5 and curated_names != [f"top {travel_type} in {location}"]:
                        return None
                        
                    photo_ref = None
                    if "photos" in r and r["photos"]:
                        photo_ref = r["photos"][0]["photo_reference"]
                        
                    return {
                        "name": r.get("name"),
                        "rating": r.get("rating", 4.0),
                        "user_ratings_total": r.get("user_ratings_total", 0),
                        "types": r.get("types", []),
                        "address": r.get("formatted_address", ""),
                        "photo_reference": photo_ref,
                        "lat": r["geometry"]["location"]["lat"],
                        "lng": r["geometry"]["location"]["lng"]
                    }
        except Exception:
            pass
            
        return None

    # Execute all place resolutions
    async with httpx.AsyncClient() as client:
        if len(curated_names) == 1 and "top " in curated_names[0]:
            # This is the old fallback query where OpenAI failed
            fallback_res = await fetch_exact_place(client, curated_names[0])
            if fallback_res:
                 # Actually, if it was a generic query, we need to extract all results, not just [0]
                 resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params={"query": curated_names[0], "key": GOOGLE_MAPS_API_KEY}, timeout=10.0
                 )
                 if resp.status_code == 200:
                     for r in resp.json().get("results", [])[:8]:
                          photo_ref = r["photos"][0]["photo_reference"] if "photos" in r else None
                          places.append({"name": r.get("name"), "rating": r.get("rating", 4.0), "user_ratings_total": r.get("user_ratings_total", 0), "types": r.get("types", []), "address": r.get("formatted_address", ""), "photo_reference": photo_ref, "lat": r["geometry"]["location"]["lat"], "lng": r["geometry"]["location"]["lng"]})
        else:
            # Multi-pronged parallel exact resolution for OpenAI's named list
            tasks = [fetch_exact_place(client, name) for name in curated_names]
            resolved = await asyncio.gather(*tasks)
            places = [p for p in resolved if p is not None]

    if places:
        # Sort entirely resolved places by actual Google Map ratings
        places.sort(key=lambda x: x["rating"] * min(x["user_ratings_total"], 1000), reverse=True)
        _cache[cache_key] = places
        _save_cache(_cache)
        return places

    return _get_mock_places(location, travel_type)

def _get_mock_places(location: str, travel_type: str) -> list:
    return [
        {"name": f"Famous {travel_type.split()[0].capitalize()} in {location}", "rating": 4.5, "types": ["point_of_interest"]},
        {"name": f"{location} Central Square", "rating": 4.2, "types": ["point_of_interest"]},
        {"name": f"Historic Monument of {location}", "rating": 4.8, "types": ["point_of_interest"]}
    ]
