from fastapi import APIRouter, Query, Body
from app.services.planner_service import generate_smart_planner_proposals

router = APIRouter(prefix="/api", tags=["travel"])


@router.post("/travel/planner")
async def intelligent_travel_planner(
    city: str = Body(..., embed=True),
    days: int = Body(3, embed=True),
    budget: str = Body("Moderate", embed=True),
    travel_type: str = Body("Relax", embed=True)
):
    """
    Core AI engine endpoint.
    Retrieves the User Request Plan, and generates an Alternative AI Plan.
    Computes Costs, Itineraries, Places, and Contextual Reasonings.
    """
    try:
        data = await generate_smart_planner_proposals(city, days, budget, travel_type)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
