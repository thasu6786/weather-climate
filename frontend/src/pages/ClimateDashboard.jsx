import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Thermometer, Droplets, Wind, Eye, Gauge, ShieldAlert, TrendingUp, Activity, BrainCircuit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import SmartCard from '../components/ui/SmartCard';

const anim = { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } };

export default function ClimateDashboard() {
  const { selectedCity, setGlobalWeatherCondition } = useApp();
  const [weather, setWeather] = useState(null);
  const [aqiData, setAqi] = useState(null);
  const [risk, setRisk] = useState(null);
  const [timeSeries, setTimeSeries] = useState(null);
  
  // Phase 7 AI State
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getWeather(selectedCity),
      api.getAQI(selectedCity),
      api.getRisk(selectedCity),
      api.getTimeSeries(selectedCity),
      api.getForecast(selectedCity), // Phase 7
    ])
      .then(([w, a, r, ts, f]) => { 
        setWeather(w); setAqi(a); setRisk(r); setTimeSeries(ts); setForecast(f); 
        if (w?.main_condition) setGlobalWeatherCondition(w.main_condition);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCity, setGlobalWeatherCondition]);

  if (loading) return <LoadingSkeleton />;

  const aqiBadgeClass = { Good: 'badge-good', Fair: 'badge-fair', Moderate: 'badge-moderate', Poor: 'badge-poor', 'Very Poor': 'badge-danger' }[aqiData?.label] || 'badge-fair';

  // Radar data for risk breakdown
  const radarData = risk?.breakdown ? [
    { factor: 'Heat', value: risk.breakdown.heat_risk, fullMark: 100 },
    { factor: 'AQI', value: risk.breakdown.aqi_risk, fullMark: 100 },
    { factor: 'Humidity', value: risk.breakdown.humidity_risk, fullMark: 100 },
    { factor: 'Wind', value: risk.breakdown.wind_risk, fullMark: 100 },
  ] : [];

  // Time series chart data
  const chartData = timeSeries?.labels?.map((label, i) => ({
    month: label,
    temperature: timeSeries.temperature?.[i],
    humidity: timeSeries.humidity?.[i],
    aqi: timeSeries.aqi?.[i],
    rainfall: timeSeries.rainfall?.[i],
  })) || [];

  return (
    <div>
      <motion.div {...anim} className="page-header">
        <h1>Climate Dashboard — {selectedCity}</h1>
        <p>Real-time weather, air quality, and risk analysis</p>
      </motion.div>

      {/* Phase 7: Predictive Forecast Banner */}
      {forecast && forecast.recommended_window && (
        <motion.div {...anim} transition={{ delay: 0.05 }} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BrainCircuit size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>AI Forecast & Travel Window</h3>
          </div>
          <SmartCard
            title={`Optimal Travel Window: ${forecast.recommended_window}`}
            subtitle={`5-Day Predictive AI Analysis for ${selectedCity}`}
            explanation={forecast.reasoning}
            icon={TrendingUp}
            type="insight"
          />
        </motion.div>
      )}

      {/* Weather + AQI + Risk Overview */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Current Weather */}
        <motion.div {...anim} transition={{ delay: 0.05 }} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Weather</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{weather?.temperature}<sup style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>°C</sup></div>
            </div>
            <span style={{ fontSize: '3rem' }}>{weather?.main_condition === 'Clear' ? '☀️' : weather?.main_condition === 'Clouds' ? '☁️' : weather?.main_condition === 'Rain' ? '🌧️' : '🌤️'}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: 'var(--space-md)' }}>
            {weather?.description} • Feels like {weather?.feels_like}°C
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            {[
              { icon: <Droplets size={16} />, label: 'Humidity', value: `${weather?.humidity}%` },
              { icon: <Wind size={16} />, label: 'Wind', value: `${weather?.wind_speed} m/s` },
              { icon: <Eye size={16} />, label: 'Visibility', value: `${weather?.visibility} km` },
              { icon: <Gauge size={16} />, label: 'Pressure', value: `${weather?.pressure} hPa` },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent-primary)' }}>{m.icon}</span>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AQI */}
        <motion.div {...anim} transition={{ delay: 0.1 }} className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-md)' }}>Air Quality Index</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: `conic-gradient(${aqiData?.color || '#06D6A0'} ${(aqiData?.aqi_index || 1) * 20}%, var(--bg-elevated) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                {aqiData?.aqi_index}
              </div>
            </div>
            <div>
              <span className={`badge ${aqiBadgeClass}`}>{aqiData?.label}</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{aqiData?.health_impact}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {aqiData?.pollutants?.slice(0, 4).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{p.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{p.value} µg/m³</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Score */}
        <motion.div {...anim} transition={{ delay: 0.15 }} className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-md)' }}>Risk Assessment</div>
          <div className="risk-gauge">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
              <circle cx="80" cy="80" r="70" fill="none" stroke={risk?.color || '#06D6A0'} strokeWidth="10"
                strokeDasharray={`${(risk?.composite_score || 0) / 100 * 440} 440`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${risk?.color || '#06D6A0'}40)` }}
              />
            </svg>
            <div className="gauge-value">
              <div className="gauge-number" style={{ color: risk?.color }}>{risk?.composite_score}</div>
              <div className="gauge-label">{risk?.level}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-md)' }}>
            <span className={`badge ${risk?.composite_score > 50 ? 'badge-danger' : risk?.composite_score > 25 ? 'badge-moderate' : 'badge-good'}`}>
              <ShieldAlert size={12} /> {risk?.level} Risk
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Temperature & Humidity Timeline */}
        <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Temperature & Humidity Trends</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
                <Legend />
                <Area type="monotone" dataKey="temperature" stroke="#EF4444" fill="url(#tempGrad)" name="Temp (°C)" strokeWidth={2} />
                <Area type="monotone" dataKey="humidity" stroke="#3B82F6" fill="url(#humGrad)" name="Humidity (%)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Radar */}
        <motion.div {...anim} transition={{ delay: 0.25 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Risk Factor Breakdown</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                <Radar name="Risk" dataKey="value" stroke="#06D6A0" fill="#06D6A0" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AQI Bar + Rainfall */}
      <div className="grid-2">
        <motion.div {...anim} transition={{ delay: 0.3 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Monthly AQI Levels</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
                <Bar dataKey="aqi" name="AQI" radius={[4, 4, 0, 0]} fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...anim} transition={{ delay: 0.35 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Rainfall Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
                <Bar dataKey="rainfall" name="Rainfall (mm)" radius={[4, 4, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recommendations */}
      {risk?.recommendations?.length > 0 && (
        <motion.div {...anim} transition={{ delay: 0.4 }} className="glass-card" style={{ marginTop: 'var(--space-xl)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-primary)' }} /> AI Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {risk.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', padding: 'var(--space-sm) 0', borderBottom: i < risk.recommendations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '8px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: '32px', width: '300px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '16px', width: '200px', marginBottom: '32px' }} />
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[1, 2, 3].map(i => <div key={i} className="glass-card skeleton" style={{ height: '280px' }} />)}
      </div>
      <div className="grid-2">
        {[1, 2].map(i => <div key={i} className="glass-card skeleton" style={{ height: '340px' }} />)}
      </div>
    </div>
  );
}
