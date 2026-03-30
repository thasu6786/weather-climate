import random
import time
from app.config import INDIAN_CITIES, TOURIST_PLACES


def get_travel_recommendations(city: str = None, preferences: dict = None) -> dict:
    """Generate AI-powered travel recommendations."""
    seed = int(time.time() // 3600)
    random.seed(seed)

    if city:
        cities = [c for c in INDIAN_CITIES if c["name"].lower() == city.lower()]
        if not cities:
            cities = INDIAN_CITIES[:5]
    else:
        cities = random.sample(INDIAN_CITIES, min(6, len(INDIAN_CITIES)))

    recommendations = []
    for c in cities:
        places = TOURIST_PLACES.get(c["name"], ["Local sightseeing"])
        comfort = random.randint(60, 95)
        cost_level = random.choice(["Budget", "Moderate", "Premium"])
        best_months = _get_best_months(c["lat"])

        recommendations.append({
            "city": c["name"],
            "state": c["state"],
            "lat": c["lat"],
            "lon": c["lon"],
            "comfort_score": comfort,
            "cost_level": cost_level,
            "best_time": best_months,
            "top_places": places[:4],
            "highlights": _get_highlights(c["name"]),
            "avg_daily_budget": _get_budget(cost_level),
            "travel_tips": _get_travel_tips(c["name"]),
        })

    recommendations.sort(key=lambda x: x["comfort_score"], reverse=True)

    return {
        "recommendations": recommendations,
        "total": len(recommendations),
    }


def generate_itinerary(city: str, days: int = 3) -> dict:
    """Generate a day-by-day travel itinerary."""
    places = TOURIST_PLACES.get(city, ["Local market", "City center", "Park"])
    city_data = next((c for c in INDIAN_CITIES if c["name"].lower() == city.lower()), None)

    itinerary = []
    time_slots = [
        ("06:00", "07:00", "Morning walk / Yoga"),
        ("07:30", "08:30", "Breakfast"),
        ("09:00", "12:00", "Morning sightseeing"),
        ("12:30", "13:30", "Lunch"),
        ("14:00", "17:00", "Afternoon exploration"),
        ("17:30", "19:00", "Evening activity"),
        ("19:30", "21:00", "Dinner & leisure"),
    ]

    for day in range(1, min(days + 1, 8)):
        activities = []
        random.seed(sum(ord(c) for c in city) + day)
        day_places = random.sample(places, min(3, len(places)))

        for i, (start, end, default) in enumerate(time_slots):
            if i == 2 and day_places:
                activity = f"Visit {day_places[0]}"
            elif i == 4 and len(day_places) > 1:
                activity = f"Explore {day_places[1]}"
            elif i == 5 and len(day_places) > 2:
                activity = f"Evening at {day_places[2]}"
            else:
                activity = default

            activities.append({
                "start_time": start,
                "end_time": end,
                "activity": activity,
                "type": "sightseeing" if "Visit" in activity or "Explore" in activity else "leisure",
            })

        itinerary.append({
            "day": day,
            "title": f"Day {day} - {'Arrival & Orientation' if day == 1 else 'Departure' if day == days else f'Exploring {city}'}",
            "activities": activities,
        })

    return {
        "city": city,
        "state": city_data["state"] if city_data else "",
        "days": days,
        "itinerary": itinerary,
        "estimated_budget": _get_budget("Moderate") * days,
        "tips": _get_travel_tips(city),
    }


def _get_best_months(lat: float) -> str:
    if lat > 28:
        return "Mar-Jun, Sep-Nov"
    elif lat > 20:
        return "Oct-Mar"
    else:
        return "Nov-Feb"


def _get_highlights(city: str) -> list:
    highlights_map = {
        "Mumbai": ["Street Food Capital", "Bollywood Tours", "Colonial Architecture"],
        "Delhi": ["Historical Monuments", "Street Food", "Cultural Hub"],
        "Bangalore": ["IT Hub", "Pleasant Weather", "Craft Beer Scene"],
        "Chennai": ["Temple Architecture", "Beach Culture", "Classical Music"],
        "Kolkata": ["Art & Culture", "Street Food", "Victorian Architecture"],
        "Jaipur": ["Royal Heritage", "Colorful Markets", "Desert Safari"],
        "Goa": ["Beach Paradise", "Nightlife", "Portuguese Heritage"],
        "Varanasi": ["Spiritual Capital", "Ganga Aarti", "Ancient Temples"],
        "Shimla": ["Hill Station", "Colonial Charm", "Snow Activities"],
        "Udaipur": ["Lake City", "Royal Palaces", "Romantic Getaway"],
    }
    return highlights_map.get(city, ["Cultural Experience", "Local Cuisine", "Natural Beauty"])


def _get_budget(level: str) -> int:
    return {"Budget": 1500, "Moderate": 3500, "Premium": 8000}.get(level, 3500)


def _get_travel_tips(city: str) -> list:
    general = [
        "Carry sunscreen and a water bottle",
        "Use public transport or ride-sharing apps",
        "Try local street food from popular stalls",
        "Bargain at local markets (except fixed-price shops)",
        "Keep digital copies of all travel documents",
    ]
    random.seed(sum(ord(c) for c in city))
    return random.sample(general, 3)
