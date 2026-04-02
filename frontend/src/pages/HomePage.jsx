import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Navigation, MapPin, Loader2, Cloud, Sun, CloudRain, Zap, CloudSnow, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

/* ── Animation Presets ── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const WEATHER_ICONS = {
  Clear: Sun, Clouds: Cloud, Rain: CloudRain, Snow: CloudSnow, Thunderstorm: Zap
};
const getWeatherIcon = (c) => WEATHER_ICONS[c] || Cloud;

export default function HomePage() {
  const { setSelectedCity, setLocationWeather, setGlobalWeatherCondition } = useApp();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search Engine States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    api.getAllCitiesWeather()
      .then(data => {
        setCities(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // -- Master Search Logic --
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await api.searchLocation(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCityClick = (cityData) => {
    setSelectedCity(cityData.city || cityData.name);
    navigate('/dashboard');
  };

  const handleSelectSuggestion = async (s) => {
    setSearchQuery(s.name);
    setSuggestions([]);
    
    // Resolve full climate context to navigate deeply
    try {
      const climateData = await api.exploreLocation(s.lat, s.lon, s.name);
      setLocationWeather(climateData);
      if (climateData.condition) setGlobalWeatherCondition(climateData.condition);
      setSelectedCity(s.name);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      // Fallback if full discovery fails, just set the string and pray
      setSelectedCity(s.name);
      navigate('/dashboard');
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lon } = position.coords;
          const markerData = await api.exploreLocation(lat, lon, "Your Location");
          setLocationWeather(markerData);
          if (markerData.condition) setGlobalWeatherCondition(markerData.condition);
          setSelectedCity(markerData.city || "Unknown");
          navigate('/dashboard');
        } catch (error) {
          console.error('Location error:', error);
          alert('Could not resolve your climate context.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Please allow location permissions to use auto-detect features.');
        setIsLocating(false);
      }
    );
  };

  // The 20 Indian cities configured in the backend
  const displayCities = cities.slice(0, 20);

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. PROJECT HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ 
          background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-3xl) var(--space-xl)',
          textAlign: 'center',
          marginBottom: 'var(--space-2xl)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)', pointerEvents: 'none' }} />
        
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
          Urban Climate Intelligence
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
          Real-time global weather grids, dynamic AQI risk assessments, and intelligent travel logistics powered by Deep Data Arrays.
        </p>

        {/* 2. CENTRAL SEARCH ENGINE */}
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', zIndex: 10 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', 
            border: '2px solid var(--border-focus)', borderRadius: '100px', 
            padding: '12px 24px', boxShadow: 'var(--shadow-glow)' 
          }}>
            <Search size={22} style={{ color: 'var(--accent-primary)', marginRight: '12px' }} />
            <input 
              type="text" 
              placeholder="Search for any city, district, or global region..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flex: 1, border: 'none', background: 'transparent', outline: 'none', 
                fontSize: '1.1rem', color: 'var(--text-primary)' 
              }}
            />
            {isSearching && <Loader2 className="spin" size={20} style={{ color: 'var(--text-muted)' }}/>}
          </div>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
                }}
              >
                {suggestions.map((s, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSelectSuggestion(s)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '16px 20px', background: 'transparent', 
                      border: 'none', borderBottom: '1px solid var(--border)', display: 'flex', 
                      alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Globe size={18} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {s.state ? `${s.state}, ` : ''}{s.country} {s.local_names?.en ? `(${s.local_names.en})` : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. GEOLOCATION ACTION */}
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <button 
            onClick={handleLocateMe}
            disabled={isLocating}
            className="btn btn-secondary"
            style={{ borderRadius: '100px', padding: '10px 24px', fontSize: '1rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {isLocating ? <Loader2 size={18} className="spin" /> : <Navigation size={18} />}
            {isLocating ? "Resolving precise coordinates..." : "Use My Location"}
          </button>
        </div>
      </motion.div>

      {/* 4. PARALLEL 10-10 CITY GRID */}
      <h2 style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
        <MapPin size={24} style={{ color: 'var(--accent-primary)' }}/> 
        Key Metropolitans & Global Centers
      </h2>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--accent-primary)' }}/>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid-2">
          
          {/* LEFT COLUMN: 1-10 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayCities.slice(0, 10).map((city, idx) => {
              const Icon = getWeatherIcon(city.main_condition);
              return (
                <motion.div 
                  key={idx} variants={fadeUp}
                  className="glass-card"
                  style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => handleCityClick(city)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '4px' }}>{city.city}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to reveal fully rendered dashboard analytics</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{city.temperature}°C</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AQI: {city.aqi}</span>
                    </div>
                    <Icon size={28} style={{ color: 'var(--accent-secondary)' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: 11-20 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayCities.slice(10, 20).map((city, idx) => {
              const Icon = getWeatherIcon(city.main_condition);
              return (
                <motion.div 
                  key={idx} variants={fadeUp}
                  className="glass-card"
                  style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => handleCityClick(city)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '4px' }}>{city.city}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to reveal fully rendered dashboard analytics</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{city.temperature}°C</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AQI: {city.aqi}</span>
                    </div>
                    <Icon size={28} style={{ color: 'var(--accent-secondary)' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

        </motion.div>
      )}

    </div>
  );
}
