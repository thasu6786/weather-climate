from fastapi import APIRouter, Query
from app.services.aqi_service import get_aqi_by_city

router = APIRouter(prefix="/api", tags=["aqi"])


@router.get("/aqi")
async def aqi(city: str = Query(..., description="City name")):
    data = await get_aqi_by_city(city)
    return {"status": "success", "data": data}
