import json
from typing import Dict, List, Any

# ---------------------------------------------------------
# 1. UNIFIED SCORING SYSTEM
# ---------------------------------------------------------
def calculate_comfort_score(weather_data: Dict[str, Any]) -> int:
    """Calculates a 0-100 comfort score based on temperature, humidity, and wind."""
    temp = weather_data.get("temperature", 25)
    humidity = weather_data.get("humidity", 50)
    
    score = 100
    
    # Temperature heuristic (Ideal: 18-26C)
    if temp < 10:
        score -= (10 - temp) * 3
    elif temp > 32:
        score -= (temp - 32) * 5
    elif temp < 18:
        score -= (18 - temp) * 1.5
    elif temp > 26:
        score -= (temp - 26) * 3
        
    # Humidity heuristic (Ideal: 30-60%)
    if humidity > 70:
        score -= (humidity - 70) * 0.5
    elif humidity < 20:
        score -= (20 - humidity) * 0.5
        
    return max(0, min(100, int(score)))

def calculate_budget_score(expected_cost: float, max_budget: float) -> int:
    """Calculates a 0-100 score on how well an option fits the budget."""
    if expected_cost == 0 or max_budget == 0:
        return 100
    # The lower the cost relative to budget, the higher the score.
    ratio = expected_cost / max_budget
    if ratio > 1.2:
        return 0
    score = 100 - (ratio * 100)
    return max(0, min(100, int(score)))

def calculate_suitability_score(comfort: int, risk: int, budget: int) -> int:
    """Weighted composite score for decision ranking."""
    # Suitability favors high comfort, low risk, high budget efficiency
    risk_inverted = 100 - risk
    # Weights: Comfort 40%, Risk Avoidance 40%, Budget 20%
    score = (comfort * 0.4) + (risk_inverted * 0.4) + (budget * 0.2)
    return int(score)


# ---------------------------------------------------------
# 2. DECISION ENGINE & EXPLAINABLE AI (XAI)
# ---------------------------------------------------------
def evaluate_options(options: List[Dict[str, Any]], user_budget: float) -> Dict[str, Any]:
    """
    Takes an array of destination/plan options and ranks them using the Scoring System.
    Generates an Explainable AI rationale for the top choice.
    """
    if not options:
        return {"best_option": None, "ranked": [], "explanation": "No options provided."}

    evaluated = []
    
    for opt in options:
        weather = opt.get("weather", {})
        aqi = opt.get("aqi", {}).get("aqi_index", 1)  # 1-5 scale
        cost = opt.get("cost", 0)
        
        # Determine base scores
        comfort = calculate_comfort_score(weather)
        risk = (aqi - 1) * 20  # Simple linear risk from AQI for this context
        if weather.get("temperature", 25) > 35:
            risk += 30
            
        budget_score = calculate_budget_score(cost, user_budget)
        suitability = calculate_suitability_score(comfort, min(100, risk), budget_score)
        
        opt_eval = {
            "id": opt.get("id"),
            "name": opt.get("name"),
            "scores": {
                "comfort": comfort,
                "risk": min(100, risk),
                "budget": budget_score,
                "suitability": suitability
            },
            "raw_data": opt
        }
        evaluated.append(opt_eval)
        
    # Sort by descending suitability
    ranked = sorted(evaluated, key=lambda x: x["scores"]["suitability"], reverse=True)
    best = ranked[0]
    
    # Generate Explainable AI (XAI) rationale
    rationale = generate_explanation(best["name"], best["scores"], best["raw_data"])
    
    return {
        "best_option": best,
        "ranked_alternatives": ranked[1:],
        "decision_score": best["scores"]["suitability"],
        "explanation": rationale
    }

def generate_explanation(name: str, scores: Dict[str, int], raw_data: Dict[str, Any]) -> str:
    """Uses heuristics to generate a human-readable AI explanation of the decision."""
    reasons = []
    
    if scores["comfort"] > 80:
        temp = raw_data.get("weather", {}).get("temperature", "mild")
        reasons.append(f"ideal comfort conditions ({temp}°C)")
    
    if scores["risk"] < 20:
        reasons.append("very low environmental risk and good air quality")
        
    if scores["budget"] >= 80:
        cost = raw_data.get("cost", 0)
        if cost == 0:
            reasons.append("it is completely free")
        else:
            reasons.append("it is highly cost-effective and well under your budget")
            
    if not reasons:
        return f"{name} was selected as the most balanced option available considering your constraints."
        
    if len(reasons) == 1:
        return f"{name} is the best option today primarily due to {reasons[0]}."
    
    joined_reasons = ", ".join(reasons[:-1]) + ", and " + reasons[-1]
    return f"{name} is recommended because it offers {joined_reasons}."


# ---------------------------------------------------------
# 3. SMART EXPENSE OPTIMIZER
# ---------------------------------------------------------
def optimize_expenses(expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyzes a list of expenses to provide cost-saving insights and warnings."""
    if not expenses:
        return {"status": "empty", "insights": ["Add some expenses to see smart insights."]}
        
    total = sum(e.get("amount", 0) for e in expenses)
    if total == 0:
        return {"status": "free", "insights": ["No money spent yet. Great job!"]}
        
    categories = {}
    for e in expenses:
        cat = e.get("category", "other").lower()
        categories[cat] = categories.get(cat, 0) + e.get("amount", 0)
        
    insights = []
    potential_savings = 0
    
    # Analyze Food
    food_total = categories.get("food", 0) + categories.get("dining", 0)
    if food_total > (total * 0.4):
        saving = int(food_total * 0.2)
        potential_savings += saving
        insights.append({
            "type": "warning", 
            "message": f"Food accounts for {int((food_total/total)*100)}% of your spending. Switch to cheaper dining to save roughly ₹{saving}."
        })
        
    # Analyze Transport
    transport_total = categories.get("transport", 0) + categories.get("cab", 0)
    if transport_total > (total * 0.3):
        saving = int(transport_total * 0.25)
        potential_savings += saving
        insights.append({
            "type": "alert",
            "message": f"High transport costs detected. Consider public transit for your next trip to save ₹{saving}."
        })
        
    if not insights:
        insights.append({
            "type": "success",
            "message": "Your spending is well-balanced across categories. No obvious anomalies detected."
        })
        
    return {
        "status": "analyzed",
        "total_analyzed": total,
        "potential_savings": potential_savings,
        "insights": insights
    }


# ---------------------------------------------------------
# 4. PREDICTIVE FORECAST ANALYSIS
# ---------------------------------------------------------
def analyze_forecast(forecast_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Takes 5-day forecast data from OpenWeather and determines the best day to travel.
    Expects a list of dicts with 'date', 'temp', 'humidity', 'wind'
    """
    if not forecast_list:
        return {"best_day": None, "analysis": "Insufficient forecast data."}
        
    days = []
    for day in forecast_list:
        weather_mock = {
            "temperature": day.get("temp", 25),
            "humidity": day.get("humidity", 50),
            "wind_speed": day.get("wind", 5)
        }
        comfort = calculate_comfort_score(weather_mock)
        days.append({
            "date": day.get("date", "Unknown"),
            "comfort": comfort,
            "temp": day.get("temp", 25)
        })
        
    # Find day with max comfort
    best_day = max(days, key=lambda x: x["comfort"])
    
    analysis = f"Based on predictive models, {best_day['date']} is optimal with an estimated comfort score of {best_day['comfort']}/100 and temp of {best_day['temp']}°C."
    
    return {
        "best_day": best_day["date"],
        "max_comfort": best_day["comfort"],
        "days_analyzed": days,
        "analysis": analysis
    }
