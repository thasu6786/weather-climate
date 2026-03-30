from fastapi import APIRouter, Query
from app.services.travel_service import get_travel_recommendations, generate_itinerary

router = APIRouter(prefix="/api", tags=["travel"])


@router.get("/travel")
async def travel(city: str = Query(None, description="Optional city filter")):
    data = get_travel_recommendations(city)
    return {"status": "success", "data": data}


@router.get("/itinerary")
async def itinerary(
    city: str = Query("Jaipur", description="City name"),
    days: int = Query(3, ge=1, le=7, description="Number of days"),
):
    data = generate_itinerary(city, days)
    return {"status": "success", "data": data}
