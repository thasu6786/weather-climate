"""Quick test of all backend imports and core functions."""
try:
    from app.services.weather_service import get_weather_by_city
    from app.services.aqi_service import get_aqi_by_city
    from app.services.ml_service import perform_pca, perform_clustering
    from app.services.risk_service import calculate_risk_score
    from app.services.travel_service import get_travel_recommendations
    from app.services.expense_service import get_expenses, add_expense, suggest_mode
    from app.config import OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY

    print("ALL IMPORTS OK")

    # Test expense service
    data = get_expenses("solo")
    print(f"Solo expenses: {data['count']}")
    data = get_expenses("friends")
    print(f"Friends expenses: {data['count']}")
    data = get_expenses("family")
    print(f"Family expenses: {data['count']}")

    # Test risk service
    risk = calculate_risk_score(
        {"temperature": 35, "humidity": 70, "wind_speed": 5},
        {"aqi_index": 3},
    )
    print(f"Risk score: {risk['composite_score']}")

    # Test ML service
    pca = perform_pca()
    print(f"PCA points: {len(pca['points'])}")

    # Test travel
    rec = get_travel_recommendations("Mumbai")
    print(f"Travel recs: {rec['total']}")

    # Test mode suggestion
    mode = suggest_mode()
    print(f"Mode suggestion: {mode}")

    # Test config
    print(f"API key configured: {'Yes' if OPENWEATHER_API_KEY else 'No'}")

    print("\nALL TESTS PASSED")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
