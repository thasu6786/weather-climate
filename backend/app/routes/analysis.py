from fastapi import APIRouter, Query
from app.services.ml_service import perform_pca, perform_clustering, get_time_series, generate_climate_dataset

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/clusters")
async def clusters(n_clusters: int = Query(4, ge=2, le=8)):
    data = perform_clustering(n_clusters)
    return {"status": "success", "data": data}


@router.get("/pca")
async def pca(n_components: int = Query(2, ge=2, le=5)):
    data = perform_pca(n_components)
    return {"status": "success", "data": data}


@router.get("/timeseries")
async def timeseries(city: str = Query("Mumbai")):
    data = get_time_series(city)
    return {"status": "success", "data": data}


@router.get("/insights")
async def insights():
    from app.services.weather_service import get_all_cities_weather
    data = await get_all_cities_weather()

    if not data:
        return {"status": "error", "message": "No data available"}

    hottest = max(data, key=lambda x: x.get("temperature", 0))
    coldest = min(data, key=lambda x: x.get("temperature", 0))
    most_polluted = max(data, key=lambda x: x.get("aqi", 0))
    wettest = max(data, key=lambda x: x.get("rainfall", 0))

    return {
        "status": "success",
        "data": {
            "hottest": {"city": hottest["city"], "temperature": hottest["temperature"], "month": "Current"},
            "coldest": {"city": coldest["city"], "temperature": coldest["temperature"], "month": "Current"},
            "most_polluted": {"city": most_polluted["city"], "aqi": most_polluted["aqi"], "month": "Current"},
            "wettest": {"city": wettest["city"], "rainfall": wettest.get("rainfall", 0), "month": "Current"},
            "total_cities": len(data),
            "total_data_points": len(data),
        },
    }


@router.post("/simulation")
async def simulation(body: dict):
    """What-if simulation: adjust parameters and see impact."""
    temp = float(body.get("temperature", 35))
    humidity = float(body.get("humidity", 60))
    aqi_val = float(body.get("aqi", 100))
    wind = float(body.get("wind_speed", 5))

    from app.services.risk_service import calculate_risk_score

    weather_sim = {"temperature": temp, "humidity": humidity, "wind_speed": wind}
    aqi_sim = {"aqi_index": min(5, max(1, int(aqi_val / 50) + 1))}
    risk = calculate_risk_score(weather_sim, aqi_sim)

    return {
        "status": "success",
        "data": {
            "input": {"temperature": temp, "humidity": humidity, "aqi": aqi_val, "wind_speed": wind},
            "risk": risk,
        },
    }
