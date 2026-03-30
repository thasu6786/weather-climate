import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [userLocation, setUserLocation] = useState(null);
  const [locationWeather, setLocationWeather] = useState(null);
  const [expenseMode, setExpenseMode] = useState('solo'); // solo, friends, family
  const [expenseEnabled, setExpenseEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalWeatherCondition, setGlobalWeatherCondition] = useState('Clear'); // For dynamic backgrounds

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        selectedCity, setSelectedCity,
        userLocation, setUserLocation, detectLocation,
        locationWeather, setLocationWeather,
        expenseMode, setExpenseMode,
        expenseEnabled, setExpenseEnabled,
        sidebarOpen, setSidebarOpen,
        globalWeatherCondition, setGlobalWeatherCondition,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
