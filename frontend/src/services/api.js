const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Weather
  getWeather: (city) => fetchAPI(`/weather?city=${encodeURIComponent(city)}`),
  getWeatherByCoords: (lat, lon) => fetchAPI(`/weather/coords?lat=${lat}&lon=${lon}`),
  getAllCitiesWeather: () => fetchAPI('/weather/all'),

  // AQI
  getAQI: (city) => fetchAPI(`/aqi?city=${encodeURIComponent(city)}`),

  // Risk
  getRisk: (city) => fetchAPI(`/risk?city=${encodeURIComponent(city)}`),

  // Analysis
  getClusters: (n = 4) => fetchAPI(`/clusters?n_clusters=${n}`),
  getPCA: () => fetchAPI('/pca'),
  getTimeSeries: (city) => fetchAPI(`/timeseries?city=${encodeURIComponent(city)}`),
  getInsights: () => fetchAPI('/insights'),
  runSimulation: (params) => fetchAPI('/simulation', { method: 'POST', body: JSON.stringify(params) }),

  // Intelligent Travel Planner
  getSmartPlanner: (payload) => fetchAPI('/travel/planner', { method: 'POST', body: JSON.stringify(payload) }),

  // Map
  getMapData: () => fetchAPI('/map-data'),
  getCities: () => fetchAPI('/cities'),
  searchLocation: (q) => fetchAPI(`/location/search?q=${encodeURIComponent(q)}`),
  exploreLocation: (lat, lon, city) => fetchAPI(`/location/explore?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city || 'Unknown')}`),

  // Expenses
  getExpenses: (mode) => fetchAPI(`/expenses${mode ? `?mode=${mode}` : ''}`),
  addExpense: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  splitExpense: (data) => fetchAPI('/split', { method: 'POST', body: JSON.stringify(data) }),
  settleDebts: (members) => fetchAPI('/settle', { method: 'POST', body: JSON.stringify({ members }) }),
  getBudget: (amount) => fetchAPI(`/budget${amount ? `?budget_amount=${amount}` : ''}`),

  // Intelligence & Decision Engine (Phase 7)
  getDecision: (budget, options) => fetchAPI('/decide', { method: 'POST', body: JSON.stringify({ budget, options }) }),
  getForecast: (city) => fetchAPI(`/forecast?city=${encodeURIComponent(city)}`),
  getExpenseOptimization: (mode) => fetchAPI(`/expense/optimize?mode=${mode}`),
};

export default api;
