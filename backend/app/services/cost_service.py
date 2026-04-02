def estimate_trip_cost(city: str, days: int, budget_tier: str) -> dict:
    """
    Dynamically estimates trip expenses (Stay, Food, Activities, Travel)
    based on the tier and duration constraint.
    """
    # Base multiplier for cost tier
    tier_mul = {
        "Budget": 0.8,
        "Moderate": 1.5,
        "Premium": 3.0,
        "Luxury": 5.0
    }.get(budget_tier, 1.0)

    # Base cost values (in local currency e.g. INR per day)
    base_stay = 2500
    base_food = 1200
    base_activity = 800
    base_travel_local = 600

    # Region tier - cities like Mumbai or Goa cost more than Varanasi or Shimla
    premium_cities = ["Mumbai", "Goa", "Bangalore", "Delhi", "Udaipur"]
    budget_cities = ["Varanasi", "Rishikesh", "Jaipur", "Lucknow", "Agra"]

    region_mul = 1.0
    if city in premium_cities:
        region_mul = 1.3
    elif city in budget_cities:
        region_mul = 0.8

    # Final calculations per day
    daily_stay = base_stay * tier_mul * region_mul
    daily_food = base_food * tier_mul * region_mul
    daily_activity = base_activity * tier_mul * region_mul
    daily_travel = base_travel_local * tier_mul * region_mul
    
    # Static round-trip flight/train assumed (this could be dynamic using actual flight API)
    round_trip_transport = 6000 * tier_mul * region_mul

    return {
        "daily_breakdown": {
            "stay": int(daily_stay),
            "food": int(daily_food),
            "activities": int(daily_activity),
            "local_transport": int(daily_travel)
        },
        "days": days,
        "budget_tier": budget_tier,
        "totals": {
            "stay": int(daily_stay * days),
            "food": int(daily_food * days),
            "activities": int(daily_activity * days),
            "local_transport": int(daily_travel * days),
            "round_trip_transport": int(round_trip_transport),
            "grand_total": int((daily_stay + daily_food + daily_activity + daily_travel) * days + round_trip_transport)
        }
    }
