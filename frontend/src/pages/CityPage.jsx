import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Calendar, Star, TrendingUp, Thermometer, Cloud, Navigation, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const anim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } };
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Goa', 'Varanasi', 'Shimla', 'Udaipur', 'Manali', 'Agra'];

export default function CityPage() {
  const { selectedCity, setSelectedCity } = useApp();
  const [weather, setWeather] = useState(null);
  const [aqiData, setAqi] = useState(null);
  const [risk, setRisk] = useState(null);
  const [travel, setTravel] = useState(null);
  const [timeSeries, setTimeSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getWeather(selectedCity),
      api.getAQI(selectedCity),
      api.getRisk(selectedCity),
      api.getTravel(selectedCity),
      api.getTimeSeries(selectedCity),
    ])
      .then(([w, a, r, t, ts]) => { setWeather(w); setAqi(a); setRisk(r); setTravel(t); setTimeSeries(ts); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const rec = travel?.recommendations?.[0];
  const chartData = timeSeries?.labels?.map((label, i) => ({
    month: label,
    temperature: timeSeries.temperature?.[i],
    rainfall: timeSeries.rainfall?.[i],
  })) || [];

  return (
    <div>
      <motion.div {...anim} className="page-header">
        <h1>City Explorer</h1>
        <p>Discover climate, attractions, and best travel times</p>
      </motion.div>

      {/* City Selector */}
      <motion.div {...anim} transition={{ delay: 0.05 }} className="tab-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        {CITIES.map(c => (
          <button key={c} className={`tab-item ${selectedCity === c ? 'active' : ''}`} onClick={() => setSelectedCity(c)}>{c}</button>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => <div key={i} className="glass-card skeleton" style={{ height: '250px' }} />)}
        </div>
      ) : (
        <>
          {/* City Header */}
          <motion.div {...anim} transition={{ delay: 0.1 }} className="glass-card" style={{
            marginBottom: 'var(--space-xl)',
            background: 'linear-gradient(135deg, rgba(6,214,160,0.08) 0%, rgba(59,130,246,0.06) 100%)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MapPin size={20} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '1.75rem' }}>{selectedCity}</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{weather?.state} • {weather?.lat?.toFixed(2)}°N, {weather?.lon?.toFixed(2)}°E</p>
              {rec?.best_time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.85rem' }}>
                  <Calendar size={14} style={{ color: 'var(--accent-warm)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Best time to visit: <strong style={{ color: 'var(--text-primary)' }}>{rec.best_time}</strong></span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{weather?.temperature}<sup style={{ fontSize: '1rem' }}>°C</sup></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{weather?.description}</div>
              </div>
              {rec && (
                <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(6,214,160,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6,214,160,0.2)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>{rec.comfort_score}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMFORT</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
            {[
              { label: 'AQI', value: aqiData?.label, sub: `Index: ${aqiData?.aqi_index}`, color: aqiData?.color },
              { label: 'Risk', value: risk?.level, sub: `Score: ${risk?.composite_score}`, color: risk?.color },
              { label: 'Humidity', value: `${weather?.humidity}%`, sub: 'Relative', color: 'var(--accent-secondary)' },
              { label: 'Wind', value: `${weather?.wind_speed} m/s`, sub: `${weather?.wind_deg}° direction`, color: 'var(--accent-purple)' },
            ].map((s, i) => (
              <motion.div key={i} {...anim} transition={{ delay: 0.15 + i * 0.05 }} className="glass-card stat-card">
                <span className="stat-label">{s.label}</span>
                <div className="stat-value" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                <span className="stat-sub">{s.sub}</span>
              </motion.div>
            ))}
          </div>

          {/* Charts + Places */}
          <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
            <motion.div {...anim} transition={{ delay: 0.3 }} className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Monthly Climate</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
                    <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Temp °C" />
                    <Line type="monotone" dataKey="rainfall" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Rain mm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div {...anim} transition={{ delay: 0.35 }} className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Top Attractions</h3>
              {rec?.top_places?.map((place, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '12px 0', borderBottom: i < rec.top_places.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{place}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Must visit attraction</div>
                  </div>
                  <Star size={14} style={{ marginLeft: 'auto', color: 'var(--accent-warm)' }} />
                </div>
              ))}

              {rec?.highlights && (
                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                  {rec.highlights.map((h, i) => (
                    <span key={i} className="badge badge-fair">{h}</span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Travel Tips */}
          {rec?.travel_tips && (
            <motion.div {...anim} transition={{ delay: 0.4 }} className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={18} style={{ color: 'var(--accent-primary)' }} /> Travel Tips
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                {rec.travel_tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: 'var(--space-sm)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '8px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
