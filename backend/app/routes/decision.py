from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import time
import random
from app.services.decision_service import evaluate_options, optimize_expenses, analyze_forecast
from app.services.expense_service import get_expenses
from app.services.weather_service import get_weather_by_city

router = APIRouter(prefix="/api", tags=["Intelligence & Decision Engine"])

class DecisionRequest(BaseModel):
    budget: float = 10000.0
    options: List[Dict[str, Any]]

@router.post("/decide")
async def make_decision(request: DecisionRequest):
    """
    Evaluates multiple destination/plan options and returns the best one
    with an Explainable AI rationale.
    """
    try:
        # If options only have city names, we fetch weather and AQI for them
        enriched_options = []
        for opt in request.options:
            if "weather" not in opt and "city" in opt:
                city = opt["city"]
                weather = await get_weather_by_city(city)
                # Mock AQI based on city for this decision if not provided
                base_aqi = 2
                if city in ["Delhi", "Mumbai", "Kolkata"]:
                    base_aqi = random.randint(3, 5)
                    
                opt["weather"] = weather
                opt["aqi"] = {"aqi_index": opt.get("aqi_index", base_aqi)}
                
            enriched_options.append(opt)
            
        result = evaluate_options(enriched_options, request.budget)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
async def get_predictive_forecast(city: str = Query(..., description="City name to forecast")):
    """
    Analyzes 5-day predictive forecast to determine the best day to travel.
    """
    try:
        current_weather = await get_weather_by_city(city)
        base_temp = current_weather.get("temperature", 25)
        base_hum = current_weather.get("humidity", 50)
        
        # Generate 5-day forecast data (mocked for intelligence demo)
        forecast = []
        import datetime
        today = datetime.date.today()
        
        for i in range(1, 6):
            target_date = today + datetime.timedelta(days=i)
            day_data = {
                "date": target_date.strftime("%Y-%m-%d"),
                "temp": round(base_temp + random.uniform(-4, 4), 1),
                "humidity": max(20, min(100, int(base_hum + random.uniform(-15, 15)))),
                "wind": round(random.uniform(2, 12), 1)
            }
            forecast.append(day_data)
            
        analysis = analyze_forecast(forecast)
        return {
            "city": city,
            "forecast": forecast,
            "intelligence": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expense/optimize")
async def get_expense_optimization(mode: str = Query("solo", description="solo, friends, or family")):
    """
    Analyzes the current expenses for the given mode and returns cost-saving insights.
    """
    try:
        data = get_expenses(mode)
        expense_list = data.get("expenses", [])
        
        optimization = optimize_expenses(expense_list)
        return optimization
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
