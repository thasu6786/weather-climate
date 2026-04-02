import random
import asyncio
from app.config import INDIAN_CITIES
from app.services.weather_service import get_weather_by_city
from app.services.aqi_service import get_aqi_by_city
from app.services.risk_service import calculate_risk_score
from app.services.places_service import fetch_tourist_places
from app.services.cost_service import estimate_trip_cost

async def generate_smart_itinerary(location: str, days: int, budget: str, travel_type: str) -> dict:
    """ Generates a single dynamic itinerary using real-time open-world data for a requested location. """
    
    # 1. Fetch Real Weather & AQI
    weather_task = get_weather_by_city(location)
    aqi_task = get_aqi_by_city(location)
    weather, aqi = await asyncio.gather(weather_task, aqi_task)

    # Base AQI and Risk checking
    aqi_stub = {"aqi_index": aqi.get("aqi_index", 1), "label": aqi.get("label", "N/A")}
    risk = calculate_risk_score(weather, aqi_stub)
    
    composite_score = risk.get("composite_score", 50) # 0 is best, 100 is worst
    comfort_score = int(100 - composite_score) # Inverse for positive scoring!
    
    # Explainable AI Reason Setup
    reasons = []
    if comfort_score > 80:
        reasons.append("Spectacular climate conditions right now.")
    elif comfort_score > 60:
        reasons.append("Moderate conditions, decent time to travel.")
    else:
        reasons.append("Challenging weather or high AQI—travel with caution.")
        
    reasons.append(f"Temperature is expected to be {weather.get('temperature', '--')}°C.")
    reasons.append(f"Air Quality is securely designated as '{aqi_stub['label']}'.")

    # 2. Estimate Costs
    cost_estimation = estimate_trip_cost(location, days, budget)

    # 3. Fetch Real Google Places
    type_query = "tourist attractions"
    if travel_type.lower() == "adventure":
        type_query = "adventure sports and hiking trails"
    elif travel_type.lower() == "family":
        type_query = "family friendly parks and attractions"
    elif travel_type.lower() == "relax":
        type_query = "spa resorts beaches and scenic relaxed spots"
        
    places = await fetch_tourist_places(location, travel_type=type_query)
    
    if not places:
        # Fallback to general tourist attractions
        places = await fetch_tourist_places(location, travel_type="tourist attractions")
        
    # Provide placeholders if total places are fewer than expected
    if len(places) == 0:
        places = [
            {"name": f"{location} City Center", "rating": 4.0},
            {"name": f"{location} Famous Monument", "rating": 4.2},
            {"name": f"Local Market in {location}", "rating": 4.5}
        ]

    # 4. Synthesize Day-by-Day Itinerary 
    itinerary = []
    place_index = 0
    total_places = len(places)
    
    # Spread the places across the days logically
    places_per_day = max(2, total_places // days)
    if places_per_day > 4:
        places_per_day = 4 # Don't pack too much

    time_slots = [
        ("09:00", "11:30", "Morning Exploration"),
        ("12:00", "13:30", "Lunch Break at Local Cafe"),
        ("14:00", "17:00", "Afternoon Discovery"),
        ("17:30", "19:00", "Evening Relaxation")
    ]
    
    for day in range(1, days + 1):
        day_activities = []
        
        for idx in range(places_per_day):
            if place_index < total_places:
                selected_place = places[place_index]
                
                # Assign to a time slot, wrap around if needed
                slot = time_slots[idx % len(time_slots)]
                
                day_activities.append({
                    "start_time": slot[0],
                    "end_time": slot[1],
                    "activity": f"Visit {selected_place['name']}",
                    "place_rating": selected_place.get('rating', 'No rating'),
                    "type": "sightseeing"
                })
                place_index += 1
            else:
                break
                
        # Add a dinner/leisure closing activity
        day_activities.append({
            "start_time": "19:30",
            "end_time": "21:00",
            "activity": f"Dinner & Leisure near your Stay",
            "type": "leisure"
        })
                
        itinerary.append({
            "day": day,
            "title": f"Day {day} in {location}",
            "activities": day_activities
        })

    plan = {
        "city": location,
        "comfort_score": comfort_score,
        "weather": {
            "temp": weather.get('temperature', 0),
            "condition": weather.get('main_condition', 'Clear')
        },
        "aqi_label": aqi_stub['label'],
        "reasoning": reasons,
        "cost": cost_estimation,
        "itinerary": itinerary,
        "top_places_metadata": places[:4] # Used for cover images or map pins
    }
    
    return plan

async def generate_smart_planner_proposals(base_location: str, days: int, budget: str, travel_type: str) -> dict:
    """
    Intelligent algorithm that compares the user's requested location with an alternative
    'AI Recommended' location to provide decision support.
    """
    
    # Plan A: The User's Explicit Request
    plan_a_task = generate_smart_itinerary(base_location, days, budget, travel_type)
    
    # Try to pick a highly contrasting AI alternative city from INDIAN_CITIES
    # (Preferably somewhere with theoretically great comfort scores)
    alt_candidates = random.sample(INDIAN_CITIES, 3)
    alt_city = alt_candidates[0]["name"]
    # Ensure it's not the same as requested
    if alt_city.lower() == base_location.lower():
        alt_city = alt_candidates[1]["name"]
        
    # Plan B: The AI Alternative
    plan_b_task = generate_smart_itinerary(alt_city, days, budget, travel_type)
    
    plan_a, plan_b = await asyncio.gather(plan_a_task, plan_b_task)
    
    return {
        "user_request_plan": plan_a,
        "ai_alternative_plan": plan_b
    }
