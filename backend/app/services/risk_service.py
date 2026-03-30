import math


def calculate_heat_index(temp: float, humidity: float) -> float:
    """Calculate heat index from temperature (°C) and humidity (%)."""
    T = temp * 9 / 5 + 32  # Convert to Fahrenheit
    RH = humidity
    if T < 80:
        return temp
    HI = (
        -42.379
        + 2.04901523 * T
        + 10.14333127 * RH
        - 0.22475541 * T * RH
        - 0.00683783 * T * T
        - 0.05481717 * RH * RH
        + 0.00122874 * T * T * RH
        + 0.00085282 * T * RH * RH
        - 0.00000199 * T * T * RH * RH
    )
    return round((HI - 32) * 5 / 9, 1)


def calculate_risk_score(weather: dict, aqi: dict) -> dict:
    """Calculate composite risk score from weather and AQI data."""
    temp = weather.get("temperature", 25)
    humidity = weather.get("humidity", 50)
    wind = weather.get("wind_speed", 5)
    aqi_index = aqi.get("aqi_index", 1)

    # Heat Risk (0-100)
    heat_index = calculate_heat_index(temp, humidity)
    if heat_index >= 54:
        heat_risk = 100
    elif heat_index >= 41:
        heat_risk = 70 + (heat_index - 41) * (30 / 13)
    elif heat_index >= 32:
        heat_risk = 40 + (heat_index - 32) * (30 / 9)
    elif heat_index >= 27:
        heat_risk = 10 + (heat_index - 27) * (30 / 5)
    else:
        heat_risk = max(0, (heat_index - 15) * (10 / 12))

    # AQI Risk (0-100)
    aqi_risk = min(100, (aqi_index - 1) * 25)

    # Humidity Risk (0-100)
    if humidity > 80:
        humidity_risk = 60 + (humidity - 80) * 2
    elif humidity > 60:
        humidity_risk = 20 + (humidity - 60) * 2
    elif humidity < 20:
        humidity_risk = 40
    else:
        humidity_risk = max(0, (humidity - 30) * 0.67)

    # Wind Risk (0-100)
    if wind > 20:
        wind_risk = 60 + min(40, (wind - 20) * 4)
    elif wind > 10:
        wind_risk = 20 + (wind - 10) * 4
    else:
        wind_risk = wind * 2

    # Composite Risk Score
    composite = (
        heat_risk * 0.35
        + aqi_risk * 0.30
        + humidity_risk * 0.20
        + wind_risk * 0.15
    )
    composite = round(min(100, max(0, composite)), 1)

    # Risk Level
    if composite >= 75:
        level = "Extreme"
        color = "#EF4444"
    elif composite >= 50:
        level = "High"
        color = "#F97316"
    elif composite >= 30:
        level = "Moderate"
        color = "#F59E0B"
    elif composite >= 15:
        level = "Low"
        color = "#3B82F6"
    else:
        level = "Minimal"
        color = "#06D6A0"

    return {
        "composite_score": composite,
        "level": level,
        "color": color,
        "heat_index": round(heat_index, 1),
        "breakdown": {
            "heat_risk": round(heat_risk, 1),
            "aqi_risk": round(aqi_risk, 1),
            "humidity_risk": round(humidity_risk, 1),
            "wind_risk": round(wind_risk, 1),
        },
        "weights": {
            "heat": 0.35,
            "aqi": 0.30,
            "humidity": 0.20,
            "wind": 0.15,
        },
        "recommendations": _get_recommendations(composite, heat_risk, aqi_risk),
    }


def _get_recommendations(composite: float, heat_risk: float, aqi_risk: float) -> list:
    recs = []
    if heat_risk > 60:
        recs.append("Avoid outdoor activities during peak hours (11 AM - 4 PM)")
        recs.append("Stay hydrated — drink at least 3-4 liters of water")
    if heat_risk > 40:
        recs.append("Wear light, loose-fitting clothing and sunscreen")
    if aqi_risk > 60:
        recs.append("Wear N95 mask outdoors — air quality is hazardous")
        recs.append("Use air purifiers indoors if available")
    if aqi_risk > 30:
        recs.append("Limit prolonged outdoor exposure")
    if composite > 50:
        recs.append("Consider postponing travel to this area")
    if composite < 20:
        recs.append("Great conditions for outdoor activities and sightseeing!")
    return recs
