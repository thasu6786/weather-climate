import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  MapPin, Thermometer, Droplets, Wind, Eye, TrendingUp, TrendingDown,
  AlertTriangle, Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight,
  Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, Zap, Compass,
  BarChart3, Globe, Wallet, Users, Plane, Activity, Shield, Clock,
  ChevronRight, Navigation, X, Info, Star, Target, BrainCircuit,
  Lightbulb, CheckCircle, ExternalLink, Columns, Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

/* ── Animation Presets ── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 20, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };
const TOOLTIP_STYLE = { background: '#1C1C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '0.82rem' };
const COLORS = ['#06D6A0', '#3B82F6', '#EF4444', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#8B5CF6'];

const WEATHER_ICONS = {
  Clear: Sun, Clouds: Cloud, Rain: CloudRain, Drizzle: CloudDrizzle,
  Snow: CloudSnow, Thunderstorm: Zap, Haze: Cloud, Mist: Cloud, Smoke: Cloud, Fog: Cloud,
};
const getWeatherIcon = (c) => WEATHER_ICONS[c] || Cloud;
const getTimeGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

/* ── Comfort Score Calculator ── */
function computeComfort(temp, humidity, aqi, windSpeed) {
  const t = temp ?? 28;
  const h = humidity ?? 60;
  const a = aqi ?? 100;
  const w = windSpeed ?? 5;
  let score = 10;
  // Temperature penalty (ideal 20-28)
  if (t < 15) score -= (15 - t) * 0.3;
  else if (t > 35) score -= (t - 35) * 0.4;
  else if (t > 28) score -= (t - 28) * 0.15;
  else if (t < 20) score -= (20 - t) * 0.1;
  // Humidity penalty (ideal 40-60)
  if (h > 80) score -= (h - 80) * 0.05;
  else if (h < 30) score -= 0.5;
  // AQI penalty
  if (a > 200) score -= 3;
  else if (a > 150) score -= 2;
  else if (a > 100) score -= 1;
  else if (a > 50) score -= 0.5;
  // Wind bonus
  if (w > 2 && w < 8) score += 0.3;
  return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
}

export default function HomePage() {
  const { selectedCity, setSelectedCity, userLocation, locationWeather, setLocationWeather, setGlobalWeatherCondition } = useApp();
  const [cities, setCities] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Smart Feature States
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [chartRange, setChartRange] = useState('daily');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    Promise.all([api.getAllCitiesWeather(), api.getInsights()])
      .then(([weatherData, insightData]) => {
        setCities(Array.isArray(weatherData) ? weatherData : []);
        setInsights(insightData);
        if (userLocation) {
          api.getWeatherByCoords(userLocation.lat, userLocation.lon)
            .then(data => {
              setLocationWeather(data);
              if (data?.main_condition) setGlobalWeatherCondition(data.main_condition);
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userLocation, setLocationWeather, setGlobalWeatherCondition]);

  const handleCityClick = (city) => { setSelectedCity(city); navigate('/dashboard'); };
  const currentWeather = locationWeather || (cities.length > 0 ? cities[0] : null);

  // Build chart data from cities
  const tempChartData = cities.slice(0, 10).map(c => ({ name: c.city?.slice(0, 3), temp: c.temperature, hum: c.humidity }));
  const aqiChartData = cities.slice(0, 8).map(c => ({ name: c.city?.slice(0, 4), aqi: c.aqi || 0 }));

  // ── SMART DECISION ENGINE ──
  const bestCity = useMemo(() => {
    if (cities.length === 0) return null;
    let best = null;
    let bestScore = -1;
    cities.forEach(c => {
      const score = computeComfort(c.temperature, c.humidity, c.aqi, c.wind_speed);
      if (score > bestScore) { bestScore = score; best = { ...c, comfortScore: score }; }
    });
    return best;
  }, [cities]);

  // Generate smart alert from insights
  const alertMessage = useMemo(() => {
    if (!insights) return null;
    const hot = insights.hottest;
    if (hot && hot.temperature > 38) return `🔥 Heat Alert: Avoid outdoor travel in ${hot.city} (2–4 PM) — ${hot.temperature}°C`;
    if (hot && hot.temperature > 35) return `⚠️ High temperature warning in ${hot.city} — ${hot.temperature}°C expected`;
    const poll = insights.most_polluted;
    if (poll && poll.aqi > 200) return `😷 Air Quality Alert: ${poll.city} AQI at ${Math.round(poll.aqi)} — Limit outdoor exposure`;
    return null;
  }, [insights]);

  // Smart Insights
  const smartInsights = useMemo(() => {
    if (!cities.length || !insights) return [];
    const items = [];
    const hot = insights.hottest;
    const cold = insights.coldest;
    if (hot) items.push({ icon: TrendingUp, text: `${hot.city} is the hottest at ${hot.temperature}°C`, color: '#EF4444', type: 'warning' });
    if (cold) items.push({ icon: TrendingDown, text: `${cold.city} is the coolest at ${cold.temperature}°C`, color: '#3B82F6', type: 'info' });
    const poll = insights.most_polluted;
    if (poll) items.push({ icon: AlertTriangle, text: `AQI increasing in ${poll.city} — ${Math.round(poll.aqi)}`, color: '#F59E0B', type: 'warning' });
    if (bestCity) items.push({ icon: Star, text: `Best travel destination right now: ${bestCity.city}`, color: '#06D6A0', type: 'good' });
    items.push({ icon: Clock, text: `Best travel time today: ${new Date().getHours() < 10 ? 'Morning' : new Date().getHours() < 16 ? 'Evening' : 'Early Morning'}`, color: '#A855F7', type: 'info' });
    return items;
  }, [cities, insights, bestCity]);

  // Comfort for current location
  const currentComfort = currentWeather ? computeComfort(currentWeather.temperature, currentWeather.humidity, currentWeather.aqi, currentWeather.wind_speed) : 0;

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ═══ 1. ALERT STRIP ═══ */}
        <AnimatePresence>
          {alertMessage && !alertDismissed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))',
                border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <AlertTriangle size={16} color="#F59E0B" />
                <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 500 }}>{alertMessage}</span>
              </div>
              <button onClick={() => setAlertDismissed(true)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#F59E0B' }}>
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 2. SMART DECISION CARD ═══ */}
        {bestCity && (
          <motion.div variants={fadeUp}
            style={{ background: 'linear-gradient(135deg, rgba(6,214,160,0.08) 0%, rgba(59,130,246,0.06) 50%, rgba(168,85,247,0.05) 100%)',
              borderRadius: '20px', padding: '24px 28px', border: '1px solid rgba(6,214,160,0.15)',
              position: 'relative', overflow: 'hidden' }}>
            {/* Glow Effects */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,214,160,0.1), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '150px', height: '150px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent)', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ padding: '4px 10px', background: 'rgba(6,214,160,0.15)', borderRadius: '100px',
                    fontSize: '0.7rem', fontWeight: 600, color: '#06D6A0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <Sparkles size={11} style={{ verticalAlign: '-2px', marginRight: '4px' }} />AI Recommendation
                  </div>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
                  Best Place Today: <span style={{ color: '#06D6A0' }}>{bestCity.city}</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#A0A0B0', marginBottom: '14px', maxWidth: '480px' }}>
                  {bestCity.temperature}°C with {bestCity.description} —
                  {bestCity.comfortScore >= 8 ? ' Perfect conditions for outdoor activities' :
                   bestCity.comfortScore >= 6 ? ' Good conditions with minor advisories' :
                   ' Moderate conditions, plan accordingly'}
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={() => handleCityClick(bestCity.city)}
                    style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    View Plan <ArrowRight size={14} />
                  </button>
                  {/* ═══ 3. WHY THIS? ═══ */}
                  <button onClick={() => setShowWhyThis(!showWhyThis)}
                    style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#A0A0B0',
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                    <Info size={14} /> Why this?
                  </button>
                </div>
              </div>

              {/* Comfort Score Gauge */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#06D6A0" strokeWidth="6"
                      strokeDasharray={`${(bestCity.comfortScore / 10) * 264} 264`}
                      strokeLinecap="round" transform="rotate(-90 50 50)"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(6,214,160,0.4))' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#06D6A0' }}>
                      {bestCity.comfortScore}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#65657A' }}>/10</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#65657A', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comfort</div>
              </div>
            </div>

            {/* Why This? Expandable */}
            <AnimatePresence>
              {showWhyThis && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: '16px', padding: '14px 18px', background: 'rgba(6,214,160,0.06)',
                    borderRadius: '12px', border: '1px solid rgba(6,214,160,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <BrainCircuit size={14} color="#06D6A0" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#06D6A0' }}>AI Explanation</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#A0A0B0', lineHeight: 1.6, margin: 0 }}>
                    Selected <strong style={{ color: '#fff' }}>{bestCity.city}</strong> because
                    the temperature is {bestCity.temperature}°C (
                    {bestCity.temperature <= 28 ? 'pleasant and comfortable' : bestCity.temperature <= 32 ? 'warm but manageable' : 'hot, caution advised'}),
                    AQI is {bestCity.aqi || 'moderate'} (
                    {(bestCity.aqi || 100) <= 50 ? 'excellent air quality' : (bestCity.aqi || 100) <= 100 ? 'satisfactory conditions' : 'requires precaution'}),
                    and humidity at {bestCity.humidity}% provides
                    {bestCity.humidity <= 60 ? ' comfortable moisture levels' : ' elevated moisture'}. 
                    The comfort score of {bestCity.comfortScore}/10 is the highest across all tracked cities.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ ROW 1: Weather Hero + Highlights ═══ */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Main Weather Card with Comfort Score */}
          <div style={{ background: 'linear-gradient(145deg, #1C1C24 0%, #252530 100%)',
            borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,214,160,0.06), transparent)', pointerEvents: 'none' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Navigation size={13} color="#06D6A0" />
                <span style={{ fontSize: '0.75rem', color: '#06D6A0', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {currentWeather ? (locationWeather ? 'Your Location' : currentWeather.city) : 'Loading...'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '2px' }}>{getTimeGreeting()}</h2>
              <p style={{ fontSize: '0.85rem', color: '#65657A' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {currentWeather && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                      {currentWeather.temperature}<span style={{ fontSize: '1.5rem', color: '#65657A' }}>°C</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#A0A0B0', textTransform: 'capitalize', marginTop: '4px' }}>
                      {currentWeather.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {(() => { const WIcon = getWeatherIcon(currentWeather.main_condition); return <WIcon size={48} color="#A0A0B0" strokeWidth={1.5} />; })()}
                    <div style={{ fontSize: '0.8rem', color: '#65657A' }}>Feels like {currentWeather.feels_like || currentWeather.temperature}°</div>
                  </div>
                </div>
                {/* ═══ COMFORT SCORE under temperature ═══ */}
                <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(6,214,160,0.06)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(6,214,160,0.08)' }}>
                  <Heart size={14} color="#06D6A0" />
                  <span style={{ fontSize: '0.78rem', color: '#A0A0B0' }}>Comfort Score</span>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${currentComfort * 10}%` }} transition={{ duration: 1, delay: 0.5 }}
                      style={{ height: '100%', background: currentComfort >= 7 ? '#06D6A0' : currentComfort >= 4 ? '#F59E0B' : '#EF4444',
                        borderRadius: '100px', boxShadow: `0 0 8px ${currentComfort >= 7 ? 'rgba(6,214,160,0.4)' : 'rgba(245,158,11,0.4)'}` }} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                    color: currentComfort >= 7 ? '#06D6A0' : currentComfort >= 4 ? '#F59E0B' : '#EF4444' }}>
                    {currentComfort}/10
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Today's Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
            <HighlightCard icon={Wind} label="Wind Speed" value={`${currentWeather?.wind_speed || '--'}`} unit="m/s" color="#3B82F6" />
            <HighlightCard icon={Droplets} label="Humidity" value={`${currentWeather?.humidity || '--'}`} unit="%" color="#06D6A0"
              sub={currentWeather?.humidity > 70 ? 'High' : 'Comfortable'} />
            <HighlightCard icon={Eye} label="Visibility"
              value={`${currentWeather?.visibility ? Math.round(currentWeather.visibility / 1000) : '--'}`} unit="km" color="#F59E0B" />
            <HighlightCard icon={Thermometer} label="Pressure" value={`${currentWeather?.pressure || '--'}`} unit="hPa" color="#A855F7" />
          </div>
        </motion.div>

        {/* ═══ ROW 2: Quick Stats Strip ═══ */}
        {insights && (
          <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <QuickStat label="Hottest City" value={`${insights.hottest?.temperature}°C`} sub={insights.hottest?.city} icon={TrendingUp} color="#EF4444" />
            <QuickStat label="Coldest City" value={`${insights.coldest?.temperature}°C`} sub={insights.coldest?.city} icon={TrendingDown} color="#3B82F6" />
            <QuickStat label="Most Polluted" value={`AQI ${Math.round(insights.most_polluted?.aqi || 0)}`} sub={insights.most_polluted?.city} icon={AlertTriangle} color="#F59E0B" />
            <QuickStat label="Wettest City" value={`${Math.round(insights.wettest?.rainfall || 0)}mm`} sub={insights.wettest?.city} icon={Droplets} color="#06D6A0" />
          </motion.div>
        )}

        {/* ═══ ROW 3: Enhanced Charts + Quick Actions ═══ */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: '20px' }}>
          {/* Temperature Chart with Toggle */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.95rem' }}>City Temperatures</h4>
              {/* ═══ 4. CHART TOGGLE ═══ */}
              <div style={{ display: 'flex', gap: '2px', background: '#252530', borderRadius: '8px', padding: '2px' }}>
                {['daily', 'weekly', 'monthly'].map(r => (
                  <button key={r} onClick={() => setChartRange(r)}
                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize',
                      background: chartRange === r ? 'rgba(6,214,160,0.15)' : 'transparent',
                      color: chartRange === r ? '#06D6A0' : '#65657A', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer>
                <AreaChart data={tempChartData}>
                  <defs>
                    <linearGradient id="homeTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#65657A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#65657A', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="temp" stroke="#EF4444" fill="url(#homeTemp)" strokeWidth={2} name="°C"
                    animationDuration={1200} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Mini Insight */}
            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px',
              fontSize: '0.72rem', color: '#A0A0B0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={12} color="#F59E0B" />
              {tempChartData.length > 1 && tempChartData[tempChartData.length-1]?.temp > tempChartData[0]?.temp
                ? 'Temperature rising trend detected across cities'
                : 'Temperature stable across monitored cities'}
            </div>
          </div>

          {/* AQI Bar Chart */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.95rem' }}>Air Quality Index</h4>
              <span style={{ fontSize: '0.7rem', color: '#65657A', background: '#252530', padding: '4px 10px', borderRadius: '6px' }}>AQI</span>
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer>
                <BarChart data={aqiChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#65657A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#65657A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="aqi" radius={[4, 4, 0, 0]} name="AQI" animationDuration={1200}>
                    {aqiChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.aqi > 150 ? '#EF4444' : entry.aqi > 100 ? '#F59E0B' : '#06D6A0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(6,214,160,0.06)', borderRadius: '8px',
              fontSize: '0.72rem', color: '#A0A0B0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={12} color="#06D6A0" />
              {aqiChartData.some(d => d.aqi > 150) ? 'Some cities show concerning AQI levels' : 'Air quality is satisfactory across most cities'}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Quick Actions</h4>
            {[
              { icon: BarChart3, label: 'Climate Dashboard', desc: 'Charts & analysis', path: '/dashboard', color: '#06D6A0' },
              { icon: Globe, label: 'Interactive Map', desc: 'Explore India', path: '/map', color: '#3B82F6' },
              { icon: Plane, label: 'Travel Planner', desc: 'AI itinerary', path: '/travel', color: '#A855F7' },
              { icon: Wallet, label: 'Expense Manager', desc: 'Track & split', path: '/expenses', color: '#F59E0B' },
            ].map((action, i) => (
              <motion.button key={i} whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }} onClick={() => navigate(action.path)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  background: '#252530', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', textAlign: 'left', width: '100%', color: '#fff', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${action.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <action.icon size={16} color={action.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{action.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#65657A' }}>{action.desc}</div>
                </div>
                <ChevronRight size={14} color="#65657A" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ ROW 4: Interactive City Grid + Compare ═══ */}
        <motion.div variants={fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Cities Across India</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* ═══ 7. COMPARE CITIES ═══ */}
              <button onClick={() => setShowComparison(true)}
                style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer',
                  color: '#A855F7', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-body)' }}>
                <Columns size={13} /> Compare Cities
              </button>
              <button className="btn-ghost btn" onClick={() => navigate('/map')}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ 5. INTERACTIVE CITY CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="glass-card" style={{ height: '180px' }}>
                <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '36px', width: '40%', marginBottom: '12px' }} />
                <div className="skeleton" style={{ height: '10px', width: '80%' }} />
              </div>
            ))
          ) : (
            cities.slice(0, 8).map((city, i) => {
              const WIcon = getWeatherIcon(city.main_condition);
              const comfort = computeComfort(city.temperature, city.humidity, city.aqi, city.wind_speed);
              const aqiVal = city.aqi || 0;
              const riskLevel = aqiVal > 150 ? 'High' : aqiVal > 100 ? 'Medium' : 'Low';
              const riskColor = { High: '#EF4444', Medium: '#F59E0B', Low: '#06D6A0' }[riskLevel];
              return (
                <motion.div key={city.city} variants={fadeUp}
                  className="glass-card" onClick={() => handleCityClick(city.city)}
                  whileHover={{ y: -6, scale: 1.02, boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${COLORS[i%8]}20`, transition: { duration: 0.2 } }}
                  style={{ cursor: 'pointer', padding: '18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px',
                    borderRadius: '50%', background: `radial-gradient(circle, ${COLORS[i%8]}15, transparent)`, pointerEvents: 'none' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{city.city}</div>
                      <div style={{ fontSize: '0.7rem', color: '#65657A' }}>{city.state}</div>
                    </div>
                    <WIcon size={24} color="#A0A0B0" strokeWidth={1.5} />
                  </div>

                  <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '8px' }}>
                    {city.temperature}<span style={{ fontSize: '0.9rem', color: '#65657A' }}>°C</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#A0A0B0', textTransform: 'capitalize', marginBottom: '10px' }}>
                    {city.description}
                  </div>

                  {/* AQI Badge + Risk Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600,
                      background: aqiVal <= 50 ? 'rgba(6,214,160,0.12)' : aqiVal <= 100 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                      color: aqiVal <= 50 ? '#06D6A0' : aqiVal <= 100 ? '#F59E0B' : '#EF4444' }}>
                      AQI {aqiVal}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600,
                      background: `${riskColor}12`, color: riskColor }}>
                      {riskLevel} Risk
                    </span>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', color: '#65657A' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Droplets size={11} /> {city.humidity}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Wind size={11} /> {city.wind_speed}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: comfort >= 7 ? '#06D6A0' : '#F59E0B' }}>
                      <Heart size={11} /> {comfort}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ═══ 10. SMART INSIGHT PANEL ═══ */}
        <motion.div variants={fadeUp}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="#A855F7" /> Smart Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {smartInsights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: `${ins.color}08`, borderRadius: '12px', border: `1px solid ${ins.color}15`,
                  cursor: 'default' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${ins.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ins.icon size={16} color={ins.color} />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#A0A0B0', lineHeight: 1.4 }}>{ins.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ 8. ENHANCED FEATURE CARDS ═══ */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '8px' }}>
          {[
            { icon: Activity, title: 'Real-Time Monitoring', desc: '20+ Indian cities tracked with live weather, AQI, and climate risk analysis', color: '#06D6A0', path: '/dashboard' },
            { icon: Shield, title: 'AI Risk Engine', desc: 'Multi-factor risk scoring using heat index, UV, AQI, and ML clustering', color: '#3B82F6', path: '/visualization' },
            { icon: Sparkles, title: 'Smart Intelligence', desc: 'AI travel planner, expense optimizer, and predictive climate insights', color: '#A855F7', path: '/travel' },
          ].map((feat, i) => (
            <motion.div key={i}
              whileHover={{ y: -4, boxShadow: `0 12px 30px rgba(0,0,0,0.2), 0 0 20px ${feat.color}10` }}
              style={{ padding: '22px', background: '#1C1C24', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => navigate(feat.path)}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${feat.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <feat.icon size={18} color={feat.color} />
              </div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>{feat.title}</h4>
              <p style={{ fontSize: '0.78rem', color: '#65657A', lineHeight: 1.5, marginBottom: '14px' }}>{feat.desc}</p>
              <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px',
                background: `${feat.color}10`, borderRadius: '8px', border: `1px solid ${feat.color}20`,
                color: feat.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Explore <ExternalLink size={12} />
              </button>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>

      {/* ═══ 7. CITY COMPARISON MODAL ═══ */}
      <AnimatePresence>
        {showComparison && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowComparison(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#1C1C24', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '720px',
                border: '1px solid rgba(255,255,255,0.08)', maxHeight: '80vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Columns size={18} color="#A855F7" /> City Comparison
                </h3>
                <button onClick={() => setShowComparison(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#A0A0B0' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                  <thead>
                    <tr>
                      {['City', 'Temp', 'AQI', 'Humidity', 'Wind', 'Comfort'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', fontSize: '0.72rem', color: '#65657A', textTransform: 'uppercase',
                          letterSpacing: '0.05em', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cities.slice(0, 10).map((c, i) => {
                      const comfort = computeComfort(c.temperature, c.humidity, c.aqi, c.wind_speed);
                      const isBest = bestCity && c.city === bestCity.city;
                      return (
                        <tr key={c.city} style={{ background: isBest ? 'rgba(6,214,160,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          borderRadius: '8px' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px 0 0 8px' }}>
                            {isBest && <Star size={12} color="#06D6A0" style={{ verticalAlign: '-2px', marginRight: '4px' }} />}
                            {c.city}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{c.temperature}°C</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                              background: (c.aqi||100) <= 50 ? 'rgba(6,214,160,0.12)' : (c.aqi||100) <= 100 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                              color: (c.aqi||100) <= 50 ? '#06D6A0' : (c.aqi||100) <= 100 ? '#F59E0B' : '#EF4444' }}>
                              {c.aqi || '~100'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#A0A0B0' }}>{c.humidity}%</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#A0A0B0' }}>{c.wind_speed} m/s</td>
                          <td style={{ padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                              color: comfort >= 7 ? '#06D6A0' : comfort >= 4 ? '#F59E0B' : '#EF4444' }}>
                              {comfort}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#65657A' }}>/10</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */
function HighlightCard({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, boxShadow: `0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px ${color}15` }}
      style={{ background: '#1C1C24', borderRadius: '16px', padding: '18px',
        border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', cursor: 'default', transition: 'box-shadow 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', color: '#65657A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div style={{ marginTop: '10px' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</span>
        <span style={{ fontSize: '0.8rem', color: '#65657A', marginLeft: '3px' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#65657A', marginTop: '2px' }}>{sub}</div>}
    </motion.div>
  );
}

function QuickStat({ label, value, sub, icon: Icon, color }) {
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{ background: '#1C1C24', borderRadius: '14px', padding: '16px 18px',
        border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '14px',
        cursor: 'default', transition: 'all 0.2s' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', color: '#65657A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#65657A' }}>{sub}</div>
      </div>
    </motion.div>
  );
}
