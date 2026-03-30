import random
import time
from typing import List, Optional

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore

from app.config import INDIAN_CITIES


def generate_climate_dataset(cities: Optional[list] = None) -> dict:
    """Generate synthetic climate dataset for ML analysis."""
    if cities is None:
        cities = INDIAN_CITIES

    seed = int(time.time() // 3600)
    random.seed(seed)
    np.random.seed(seed % (2**31))

    data = []
    for city in cities:
        lat = city["lat"]
        lon = city["lon"]
        base_temp = 25 + (lat - 20) * -0.5
        base_humidity = 60 + (lon - 78) * 0.3

        for month in range(1, 13):
            seasonal = 8 * np.sin((month - 4) * np.pi / 6)
            temp = base_temp + seasonal + np.random.normal(0, 2)
            humidity = base_humidity + 15 * np.sin((month - 7) * np.pi / 6) + np.random.normal(0, 5)
            aqi = max(10, 50 + 30 * np.sin((month - 11) * np.pi / 6) + np.random.normal(0, 15))
            rainfall = max(0, 100 * np.sin((month - 3) * np.pi / 6) ** 2 + np.random.normal(0, 20))
            wind = max(1, 8 + 3 * np.sin((month - 5) * np.pi / 6) + np.random.normal(0, 2))

            data.append({
                "city": city["name"],
                "lat": lat,
                "lon": lon,
                "month": month,
                "temperature": round(float(temp), 1),
                "humidity": round(float(min(100, max(20, humidity))), 1),
                "aqi": round(float(aqi), 1),
                "rainfall": round(float(rainfall), 1),
                "wind_speed": round(float(wind), 1),
            })

    return {"data": data, "cities": [c["name"] for c in cities]}


def perform_pca(n_components: int = 2) -> dict:
    """Perform PCA on climate data."""
    dataset = generate_climate_dataset()
    data = dataset["data"]

    features = ["temperature", "humidity", "aqi", "rainfall", "wind_speed"]
    X = np.array([[d[f] for f in features] for d in data])

    # Standardize
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    std[std == 0] = 1
    X_std = (X - mean) / std

    # PCA via SVD
    U, S, Vt = np.linalg.svd(X_std, full_matrices=False)
    explained_var = (S ** 2) / (S ** 2).sum()

    components = X_std @ Vt[:n_components].T

    points = []
    for i, d in enumerate(data):
        points.append({
            "city": d["city"],
            "month": d["month"],
            "pc1": round(float(components[i, 0]), 4),
            "pc2": round(float(components[i, 1]), 4) if n_components > 1 else 0,
        })

    return {
        "points": points,
        "explained_variance": [round(float(v), 4) for v in explained_var[:n_components]],
        "total_explained": round(float(explained_var[:n_components].sum()), 4),
        "feature_names": features,
        "loadings": [
            {"feature": f, "pc1": round(float(Vt[0, i]), 4), "pc2": round(float(Vt[1, i]), 4) if n_components > 1 else 0}
            for i, f in enumerate(features)
        ],
    }


def perform_clustering(n_clusters: int = 4) -> dict:
    """Perform K-Means clustering on climate data."""
    dataset = generate_climate_dataset()
    data = dataset["data"]

    features = ["temperature", "humidity", "aqi", "rainfall", "wind_speed"]
    X = np.array([[d[f] for f in features] for d in data])

    # Standardize
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    std[std == 0] = 1
    X_std = (X - mean) / std

    # Simple K-Means
    np.random.seed(42)
    centroids = X_std[np.random.choice(len(X_std), n_clusters, replace=False)]

    for _ in range(50):
        distances = np.array([np.linalg.norm(X_std - c, axis=1) for c in centroids])
        labels = distances.argmin(axis=0)
        new_centroids = np.array([X_std[labels == k].mean(axis=0) if (labels == k).any() else centroids[k] for k in range(n_clusters)])
        if np.allclose(centroids, new_centroids, atol=1e-4):
            break
        centroids = new_centroids

    # PCA for visualization
    U, S, Vt = np.linalg.svd(X_std, full_matrices=False)
    pc = X_std @ Vt[:2].T

    cluster_colors = ["#06D6A0", "#3B82F6", "#F59E0B", "#EF4444", "#A855F7", "#EC4899"]
    cluster_names = ["Tropical Humid", "Arid Continental", "Moderate Pleasant", "Monsoon Heavy", "Cold Alpine", "Coastal Mild"]

    points = []
    for i, d in enumerate(data):
        points.append({
            "city": d["city"],
            "month": d["month"],
            "cluster": int(labels[i]),
            "cluster_name": cluster_names[int(labels[i]) % len(cluster_names)],
            "color": cluster_colors[int(labels[i]) % len(cluster_colors)],
            "pc1": round(float(pc[i, 0]), 4),
            "pc2": round(float(pc[i, 1]), 4),
            "temperature": d["temperature"],
            "humidity": d["humidity"],
            "aqi": d["aqi"],
        })

    cluster_summaries = []
    for k in range(n_clusters):
        mask = labels == k
        cluster_data = X[mask]
        if len(cluster_data) == 0:
            continue
        cluster_summaries.append({
            "cluster": k,
            "name": cluster_names[k % len(cluster_names)],
            "color": cluster_colors[k % len(cluster_colors)],
            "count": int(mask.sum()),
            "avg_temperature": round(float(cluster_data[:, 0].mean()), 1),
            "avg_humidity": round(float(cluster_data[:, 1].mean()), 1),
            "avg_aqi": round(float(cluster_data[:, 2].mean()), 1),
        })

    return {
        "points": points,
        "clusters": cluster_summaries,
        "n_clusters": n_clusters,
    }


def get_time_series(city: str) -> dict:
    """Get monthly time series data for a city."""
    dataset = generate_climate_dataset()
    city_data = [d for d in dataset["data"] if d["city"].lower() == city.lower()]
    if not city_data:
        city_data = [d for d in dataset["data"] if d["city"] == "Mumbai"]

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return {
        "city": city_data[0]["city"] if city_data else city,
        "labels": months,
        "temperature": [d["temperature"] for d in city_data],
        "humidity": [d["humidity"] for d in city_data],
        "aqi": [d["aqi"] for d in city_data],
        "rainfall": [d["rainfall"] for d in city_data],
        "wind_speed": [d["wind_speed"] for d in city_data],
    }
