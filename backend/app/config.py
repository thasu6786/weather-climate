import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
API_BASE_URL = "https://api.openweathermap.org"
CACHE_TTL = 300  # 5 minutes

INDIAN_CITIES = [
    {"name": "Mumbai", "lat": 19.076, "lon": 72.8777, "state": "Maharashtra"},
    {"name": "Delhi", "lat": 28.6139, "lon": 77.209, "state": "Delhi"},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu"},
    {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    {"name": "Hyderabad", "lat": 17.385, "lon": 78.4867, "state": "Telangana"},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "state": "Maharashtra"},
    {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "state": "Gujarat"},
    {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873, "state": "Rajasthan"},
    {"name": "Lucknow", "lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh"},
    {"name": "Kochi", "lat": 9.9312, "lon": 76.2673, "state": "Kerala"},
    {"name": "Varanasi", "lat": 25.3176, "lon": 83.0068, "state": "Uttar Pradesh"},
    {"name": "Shimla", "lat": 31.1048, "lon": 77.1734, "state": "Himachal Pradesh"},
    {"name": "Goa", "lat": 15.2993, "lon": 74.124, "state": "Goa"},
    {"name": "Udaipur", "lat": 24.5854, "lon": 73.7125, "state": "Rajasthan"},
    {"name": "Darjeeling", "lat": 27.0360, "lon": 88.2627, "state": "West Bengal"},
    {"name": "Manali", "lat": 32.2396, "lon": 77.1887, "state": "Himachal Pradesh"},
    {"name": "Agra", "lat": 27.1767, "lon": 78.0081, "state": "Uttar Pradesh"},
    {"name": "Rishikesh", "lat": 30.0869, "lon": 78.2676, "state": "Uttarakhand"},
    {"name": "Mysore", "lat": 12.2958, "lon": 76.6394, "state": "Karnataka"},
]

TOURIST_PLACES = {
    "Mumbai": ["Gateway of India", "Marine Drive", "Elephanta Caves", "Juhu Beach"],
    "Delhi": ["Red Fort", "India Gate", "Qutub Minar", "Lotus Temple"],
    "Bangalore": ["Lalbagh Botanical Garden", "Bangalore Palace", "Cubbon Park"],
    "Chennai": ["Marina Beach", "Kapaleeshwarar Temple", "Fort St. George"],
    "Kolkata": ["Victoria Memorial", "Howrah Bridge", "Indian Museum"],
    "Hyderabad": ["Charminar", "Golconda Fort", "Hussain Sagar Lake"],
    "Jaipur": ["Hawa Mahal", "Amber Fort", "City Palace", "Jantar Mantar"],
    "Agra": ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"],
    "Varanasi": ["Dashashwamedh Ghat", "Kashi Vishwanath Temple", "Sarnath"],
    "Goa": ["Calangute Beach", "Basilica of Bom Jesus", "Fort Aguada"],
    "Udaipur": ["City Palace", "Lake Pichola", "Jag Mandir"],
    "Shimla": ["Mall Road", "Jakhu Temple", "Christ Church"],
    "Manali": ["Solang Valley", "Hadimba Temple", "Rohtang Pass"],
    "Kochi": ["Fort Kochi", "Chinese Fishing Nets", "Mattancherry Palace"],
    "Rishikesh": ["Laxman Jhula", "Ram Jhula", "Triveni Ghat"],
}
