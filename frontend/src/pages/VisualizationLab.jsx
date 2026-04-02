import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Treemap, FunnelChart, Funnel, LabelList,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp, BarChart3, Activity, Layers, GitCompare, Palette,
  Grid3X3, Target, CircleDot, PieChart as PieIcon, Triangle,
  Gauge, ArrowDownUp, Waves, Radar as RadarIcon, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

/* ── Constants ─────────────────────────────────────────── */
const METRICS = ['temperature', 'humidity', 'aqi', 'rainfall', 'wind_speed'];
const METRIC_UNITS = { temperature: '°C', humidity: '%', aqi: 'idx', rainfall: 'mm', wind_speed: 'm/s' };
const METRIC_COLORS = { temperature: '#EF4444', humidity: '#3B82F6', aqi: '#F59E0B', rainfall: '#06D6A0', wind_speed: '#A855F7' };

const COLOR_THEMES = {
  default: { name: 'Default', colors: ['#06D6A0', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'], bg: '#06D6A0' },
  warm: { name: 'Warm', colors: ['#F97316', '#EF4444', '#F59E0B', '#E11D48', '#D946EF', '#FB923C'], bg: '#F97316' },
  cool: { name: 'Cool', colors: ['#06B6D4', '#3B82F6', '#8B5CF6', '#6366F1', '#14B8A6', '#0EA5E9'], bg: '#06B6D4' },
  mono: { name: 'Mono', colors: ['#E5E7EB', '#9CA3AF', '#6B7280', '#4B5563', '#D1D5DB', '#F3F4F6'], bg: '#9CA3AF' },
};

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Varanasi',
  'Shimla', 'Goa', 'Udaipur', 'Darjeeling', 'Manali', 'Agra', 'Rishikesh', 'Mysore'
];

const CHART_TYPES = [
  { id: 'line', name: 'Line', icon: TrendingUp, multi: true },
  { id: 'area', name: 'Area', icon: Waves, multi: true },
  { id: 'bar', name: 'Bar', icon: BarChart3, multi: true },
  { id: 'stackedBar', name: 'Stacked Bar', icon: Layers, multi: true },
  { id: 'horizontalBar', name: 'Horiz. Bar', icon: ArrowDownUp, multi: false },
  { id: 'scatter', name: 'Scatter', icon: CircleDot, multi: false },
  { id: 'radar', name: 'Radar', icon: RadarIcon, multi: true },
  { id: 'pie', name: 'Pie', icon: PieIcon, multi: false },
  { id: 'donut', name: 'Donut', icon: Target, multi: false },
  { id: 'treemap', name: 'Treemap', icon: Grid3X3, multi: false },
  { id: 'funnel', name: 'Funnel', icon: Triangle, multi: false },
  { id: 'composed', name: 'Composed', icon: GitCompare, multi: true },
  { id: 'heatmap', name: 'Heatmap', icon: Grid3X3, multi: false },
  { id: 'gauge', name: 'Gauge', icon: Gauge, multi: false },
  { id: 'waterfall', name: 'Waterfall', icon: Activity, multi: false },
];

const anim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } };
const tooltipStyle = { background: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', padding: '12px 16px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' };

/* ── Component ─────────────────────────────────────────── */
export default function VisualizationLab() {
  const { selectedCity } = useApp();

  // Data state
  const [timeSeries, setTimeSeries] = useState(null);
  const [pcaData, setPca] = useState(null);
  const [clusterData, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);

  // Studio state
  const [studioChart, setStudioChart] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature']);
  const [colorTheme, setColorTheme] = useState('default');
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCity, setCompareCity] = useState('Delhi');
  const [compareData, setCompareData] = useState(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);

  // Load primary data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getTimeSeries(selectedCity),
      api.getPCA(),
      api.getClusters(4),
    ])
      .then(([ts, pca, cl]) => { setTimeSeries(ts); setPca(pca); setClusters(cl); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCity]);

  // Load compare city data
  useEffect(() => {
    if (compareMode && compareCity && compareCity !== selectedCity) {
      api.getTimeSeries(compareCity)
        .then(setCompareData)
        .catch(() => setCompareData(null));
    } else {
      setCompareData(null);
    }
  }, [compareMode, compareCity, selectedCity]);

  // Chart data
  const chartData = useMemo(() => {
    if (!timeSeries?.labels) return [];
    return timeSeries.labels.map((label, i) => ({
      month: label,
      temperature: timeSeries.temperature?.[i] ?? 0,
      humidity: timeSeries.humidity?.[i] ?? 0,
      aqi: timeSeries.aqi?.[i] ?? 0,
      rainfall: timeSeries.rainfall?.[i] ?? 0,
      wind_speed: timeSeries.wind_speed?.[i] ?? 0,
    }));
  }, [timeSeries]);

  const mergedCompareData = useMemo(() => {
    if (!compareData?.labels || !chartData.length) return chartData;
    return chartData.map((d, i) => ({
      ...d,
      ...METRICS.reduce((acc, m) => ({ ...acc, [`${m}_compare`]: compareData[m]?.[i] ?? 0 }), {}),
    }));
  }, [chartData, compareData]);

  const colors = COLOR_THEMES[colorTheme].colors;

  const toggleMetric = useCallback((m) => {
    setSelectedMetrics(prev => {
      if (prev.includes(m)) return prev.length > 1 ? prev.filter(x => x !== m) : prev;
      return [...prev, m];
    });
  }, []);

  const currentChartDef = CHART_TYPES.find(c => c.id === studioChart);
  const activeData = compareMode ? mergedCompareData : chartData;

  /* ── Hero Charts ─────────────────────────────────────── */
  const renderHeroCharts = () => {
    if (loading || !chartData.length) {
      return (
        <div className="viz-hero-grid">
          {[1,2,3,4].map(i => <div key={i} className="glass-card skeleton" style={{ height: 300 }} />)}
        </div>
      );
    }

    // Radar data: normalize each metric to 0-100 scale for the latest values
    const latest = chartData[chartData.length - 1] || {};
    const radarHeroData = METRICS.map(m => {
      const vals = chartData.map(d => d[m]).filter(v => v != null);
      const max = Math.max(...vals, 1);
      return { metric: m.replace('_', ' '), value: ((latest[m] || 0) / max) * 100, raw: latest[m] || 0 };
    });

    return (
      <div className="viz-hero-grid">
        {/* 1. Temperature & Humidity Area */}
        <motion.div {...anim} transition={{ delay: 0.05 }} className="glass-card viz-hero-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#EF4444' }} />
              Temperature & Humidity Trends
            </div>
            <div className="viz-hero-badges">
              <span className="viz-mini-badge">Area</span>
              <span className="viz-mini-badge">Monthly</span>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="heroTempG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="heroHumG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Area type="monotone" dataKey="temperature" stroke="#EF4444" fill="url(#heroTempG)" strokeWidth={2} name="Temp °C" />
                <Area type="monotone" dataKey="humidity" stroke="#3B82F6" fill="url(#heroHumG)" strokeWidth={2} name="Humidity %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 2. Monthly AQI Bar */}
        <motion.div {...anim} transition={{ delay: 0.1 }} className="glass-card viz-hero-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#F59E0B' }} />
              Air Quality Index
            </div>
            <div className="viz-hero-badges">
              <span className="viz-mini-badge">Bar</span>
              <span className="viz-mini-badge">AQI</span>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="aqiBarG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="aqi" fill="url(#aqiBarG)" radius={[6, 6, 0, 0]} name="AQI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3. Climate Radar */}
        <motion.div {...anim} transition={{ delay: 0.15 }} className="glass-card viz-hero-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#06D6A0' }} />
              Climate Profile Radar
            </div>
            <div className="viz-hero-badges">
              <span className="viz-mini-badge">Radar</span>
              <span className="viz-mini-badge">Latest</span>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <RadarChart data={radarHeroData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} style={{ textTransform: 'capitalize' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Climate" dataKey="value" stroke="#06D6A0" fill="#06D6A0" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val, name, props) => [`${props.payload.raw}`, props.payload.metric]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4. Composed Overview */}
        <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card viz-hero-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#A855F7' }} />
              Rainfall & Temperature Composed
            </div>
            <div className="viz-hero-badges">
              <span className="viz-mini-badge">Composed</span>
              <span className="viz-mini-badge">Dual-Axis</span>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="rainBarG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar yAxisId="left" dataKey="rainfall" fill="url(#rainBarG)" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: '#EF4444', r: 3 }} name="Temp (°C)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    );
  };

  /* ── Studio Chart Render ─────────────────────────────── */
  const renderStudioChart = () => {
    if (!chartData.length) return <div className="skeleton" style={{ height: 380 }} />;
    const metric = selectedMetrics[0];
    const gridProps = showGrid ? { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.04)' } : null;
    const xProps = { dataKey: 'month', tick: { fill: '#6B7280', fontSize: 11 }, axisLine: false, tickLine: false };
    const yProps = { tick: { fill: '#6B7280', fontSize: 11 }, axisLine: false, tickLine: false };
    const curveType = smoothCurve ? 'monotone' : 'linear';

    switch (studioChart) {
      case 'line':
        return (
          <ResponsiveContainer>
            <LineChart data={activeData}>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {selectedMetrics.map((m, i) => (
                <Line key={m} type={curveType} dataKey={m} stroke={colors[i % colors.length]} strokeWidth={2.5} dot={{ fill: colors[i % colors.length], r: 3 }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} name={`${m.replace('_', ' ')} (${METRIC_UNITS[m]})`} />
              ))}
              {compareMode && selectedMetrics.map((m, i) => (
                <Line key={`${m}_c`} type={curveType} dataKey={`${m}_compare`} stroke={colors[(i + 3) % colors.length]} strokeWidth={2} strokeDasharray="6 4" dot={false} name={`${compareCity} ${m.replace('_', ' ')}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer>
            <AreaChart data={activeData}>
              <defs>
                {selectedMetrics.map((m, i) => (
                  <linearGradient key={m} id={`studioAreaG_${m}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {selectedMetrics.map((m, i) => (
                <Area key={m} type={curveType} dataKey={m} stroke={colors[i % colors.length]} fill={`url(#studioAreaG_${m})`} strokeWidth={2} name={`${m.replace('_', ' ')} (${METRIC_UNITS[m]})`} />
              ))}
              {compareMode && selectedMetrics.map((m, i) => (
                <Area key={`${m}_c`} type={curveType} dataKey={`${m}_compare`} stroke={colors[(i + 3) % colors.length]} fill="none" strokeWidth={2} strokeDasharray="6 4" name={`${compareCity} ${m.replace('_', ' ')}`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer>
            <BarChart data={activeData}>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {selectedMetrics.map((m, i) => (
                <Bar key={m} dataKey={m} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} name={`${m.replace('_', ' ')} (${METRIC_UNITS[m]})`} />
              ))}
              {compareMode && selectedMetrics.map((m, i) => (
                <Bar key={`${m}_c`} dataKey={`${m}_compare`} fill={colors[(i + 3) % colors.length]} radius={[6, 6, 0, 0]} fillOpacity={0.5} name={`${compareCity} ${m.replace('_', ' ')}`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'stackedBar':
        return (
          <ResponsiveContainer>
            <BarChart data={chartData}>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {selectedMetrics.map((m, i) => (
                <Bar key={m} dataKey={m} stackId="stack" fill={colors[i % colors.length]} name={m.replace('_', ' ')} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'horizontalBar':
        return (
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical">
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
              <YAxis type="category" dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              <Bar dataKey={metric} fill={colors[0]} radius={[0, 6, 6, 0]} name={metric.replace('_', ' ')} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter': {
        const m2 = selectedMetrics[1] || (METRICS.find(x => x !== metric) || 'humidity');
        const scatterPts = chartData.map(d => ({ x: d[metric], y: d[m2], month: d.month }));
        return (
          <ResponsiveContainer>
            <ScatterChart>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis dataKey="x" name={metric} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} label={{ value: metric.replace('_', ' '), fill: '#9CA3AF', fontSize: 12, position: 'bottom' }} />
              <YAxis dataKey="y" name={m2} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} label={{ value: m2.replace('_', ' '), fill: '#9CA3AF', fontSize: 12, angle: -90, position: 'left' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => val?.toFixed?.(1) ?? val} />
              <Scatter data={scatterPts} fill={colors[0]} fillOpacity={0.7} r={7}>
                {scatterPts.map((_, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      case 'radar': {
        const latest = chartData[chartData.length - 1] || {};
        const radarPts = selectedMetrics.map(m => {
          const vals = chartData.map(d => d[m]).filter(v => v != null);
          const max = Math.max(...vals, 1);
          return { metric: m.replace('_', ' '), value: ((latest[m] || 0) / max) * 100, raw: latest[m] };
        });
        return (
          <ResponsiveContainer>
            <RadarChart data={radarPts} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.2} strokeWidth={2} name={selectedCity} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val, name, props) => [`${props.payload.raw}`, props.payload.metric]} />
            </RadarChart>
          </ResponsiveContainer>
        );
      }

      case 'pie': {
        const latest = chartData[chartData.length - 1] || {};
        const piePts = selectedMetrics.map((m, i) => ({ name: m.replace('_', ' '), value: latest[m] || 0, fill: colors[i % colors.length] }));
        return (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={piePts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                {piePts.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'donut': {
        const latest = chartData[chartData.length - 1] || {};
        const donutPts = selectedMetrics.map((m, i) => ({ name: m.replace('_', ' '), value: latest[m] || 0, fill: colors[i % colors.length] }));
        return (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={donutPts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                {donutPts.map((entry, idx) => <Cell key={idx} fill={entry.fill} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'treemap': {
        const latest = chartData[chartData.length - 1] || {};
        const treePts = METRICS.map((m, i) => ({
          name: m.replace('_', ' '), size: Math.abs(latest[m] || 1), fill: colors[i % colors.length],
        }));
        const CustomTreemapContent = ({ x, y, width, height, name, fill }) => {
          if (width < 30 || height < 25) return null;
          return (
            <g>
              <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.8} rx={6} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
              <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(width / 8, 13)} fontWeight={600} style={{ textTransform: 'capitalize' }}>
                {name}
              </text>
            </g>
          );
        };
        return (
          <ResponsiveContainer>
            <Treemap data={treePts} dataKey="size" nameKey="name" content={<CustomTreemapContent />}>
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => val.toFixed(1)} />
            </Treemap>
          </ResponsiveContainer>
        );
      }

      case 'funnel': {
        const latest = chartData[chartData.length - 1] || {};
        const funnelPts = selectedMetrics
          .map((m, i) => ({ name: m.replace('_', ' '), value: Math.abs(latest[m] || 1), fill: colors[i % colors.length] }))
          .sort((a, b) => b.value - a.value);
        return (
          <ResponsiveContainer>
            <FunnelChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Funnel dataKey="value" data={funnelPts} isAnimationActive>
                <LabelList position="center" fill="#fff" fontSize={12} fontWeight={600} formatter={(val) => val.toFixed?.(1) ?? val} />
                {funnelPts.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      }

      case 'composed':
        return (
          <ResponsiveContainer>
            <ComposedChart data={activeData}>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              {selectedMetrics.map((m, i) => {
                if (i === 0) return <Bar key={m} dataKey={m} fill={colors[i]} radius={[4, 4, 0, 0]} fillOpacity={0.7} name={m.replace('_', ' ')} />;
                if (i === 1) return <Line key={m} type={curveType} dataKey={m} stroke={colors[i]} strokeWidth={2.5} dot={{ fill: colors[i], r: 3 }} name={m.replace('_', ' ')} />;
                return <Area key={m} type={curveType} dataKey={m} stroke={colors[i]} fill={colors[i]} fillOpacity={0.1} strokeWidth={2} name={m.replace('_', ' ')} />;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'heatmap': {
        const maxVal = Math.max(...chartData.flatMap(d => METRICS.map(m => d[m] || 0)), 1);
        return (
          <div style={{ width: '100%' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${chartData.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} />
              {chartData.map((d, i) => (
                <div key={i} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{d.month}</div>
              ))}
            </div>
            {/* Data rows */}
            {METRICS.map(m => (
              <div key={m} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${chartData.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center' }}>{m.replace('_', ' ')}</div>
                {chartData.map((d, i) => {
                  const val = d[m] || 0;
                  const intensity = val / maxVal;
                  const hue = m === 'temperature' ? 0 : m === 'humidity' ? 210 : m === 'aqi' ? 40 : m === 'rainfall' ? 160 : 270;
                  return (
                    <div
                      key={i}
                      className="viz-heatmap-cell"
                      style={{
                        background: `hsla(${hue}, 70%, ${25 + intensity * 40}%, ${0.3 + intensity * 0.6})`,
                        height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: intensity > 0.5 ? '#fff' : 'var(--text-muted)',
                      }}
                      title={`${m}: ${val}`}
                    >
                      {val?.toFixed?.(0) ?? val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      }

      case 'gauge': {
        const latest = chartData[chartData.length - 1] || {};
        const val = latest[metric] || 0;
        const metricMax = { temperature: 50, humidity: 100, aqi: 500, rainfall: 300, wind_speed: 30 };
        const max = metricMax[metric] || 100;
        const pct = Math.min(val / max, 1);
        const circumference = 2 * Math.PI * 85;
        const color = METRIC_COLORS[metric] || colors[0];
        return (
          <div className="viz-gauge-container">
            <div className="viz-gauge-ring">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                <circle cx="100" cy="100" r="85" fill="none" stroke={color} strokeWidth="14"
                  strokeDasharray={`${pct * circumference} ${circumference}`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${color}50)`, transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div className="viz-gauge-center">
                <div className="viz-gauge-value" style={{ color }}>{val?.toFixed?.(1) ?? val}</div>
                <div className="viz-gauge-label">{metric.replace('_', ' ')} ({METRIC_UNITS[metric]})</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {(pct * 100).toFixed(0)}% of max ({max} {METRIC_UNITS[metric]})
            </div>
          </div>
        );
      }

      case 'waterfall': {
        const vals = chartData.map(d => d[metric] || 0);
        const avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;
        const waterfallData = chartData.map((d, i) => {
          const diff = (d[metric] || 0) - (i > 0 ? (chartData[i - 1][metric] || 0) : avgVal);
          return { month: d.month, value: d[metric] || 0, diff, positive: diff >= 0 };
        });
        return (
          <ResponsiveContainer>
            <BarChart data={waterfallData}>
              {gridProps && <CartesianGrid {...gridProps} />}
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val, name) => [val?.toFixed?.(1) ?? val, name]} />
              <Bar dataKey="diff" name="Change" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.positive ? '#06D6A0' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      default:
        return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px 0' }}>Select a chart type</div>;
    }
  };

  /* ── Main Render ─────────────────────────────────────── */
  return (
    <div>
      {/* Page Header */}
      <motion.div {...anim} className="page-header">
        <h1>Visualization Lab</h1>
        <p>Interactive climate intelligence studio — {selectedCity}</p>
      </motion.div>

      {/* ─── Section 1: Hero Zone ─── */}
      <motion.div {...anim} transition={{ delay: 0.02 }}>
        <div className="viz-section-title" style={{ cursor: 'pointer' }} onClick={() => setHeroCollapsed(!heroCollapsed)}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2>Primary Insights</h2>
          <div className="viz-section-line" />
          <span className="viz-section-badge">4 CHARTS</span>
          <button
            className="btn-ghost"
            style={{ padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}
          >
            {heroCollapsed ? <Eye size={14} /> : <EyeOff size={14} />}
            {heroCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {!heroCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {renderHeroCharts()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Section 2: Visualization Studio ─── */}
      <motion.div {...anim} transition={{ delay: 0.15 }}>
        <div className="viz-section-title">
          <Palette size={18} style={{ color: '#A855F7' }} />
          <h2>Visualization Studio</h2>
          <div className="viz-section-line" />
          <span className="viz-section-badge" style={{ color: '#A855F7', background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.15)' }}>BUILD YOUR VISUAL</span>
        </div>
      </motion.div>

      <motion.div {...anim} transition={{ delay: 0.2 }} className="viz-studio">
        {/* ── Builder Boxes Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>

          {/* BOX 1: Chart Type */}
          <div className="viz-builder-box">
            <div className="viz-builder-box-header">
              <div className="viz-builder-step" style={{ '--step-color': '#06D6A0' }}>1</div>
              <div>
                <div className="viz-builder-box-title">Choose Chart Type</div>
                <div className="viz-builder-box-subtitle">Select how to visualize your data</div>
              </div>
            </div>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'All', filter: null },
                { label: 'Trends', filter: ['line', 'area', 'bar', 'stackedBar', 'horizontalBar'] },
                { label: 'Compare', filter: ['radar', 'scatter', 'composed', 'funnel'] },
                { label: 'Parts', filter: ['pie', 'donut', 'treemap', 'heatmap'] },
                { label: 'Single', filter: ['gauge', 'waterfall'] },
              ].map(cat => {
                const isActive = !cat.filter 
                  ? true 
                  : cat.filter.includes(studioChart);
                return (
                  <span
                    key={cat.label}
                    style={{
                      fontSize: '0.65rem', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      background: isActive ? 'rgba(6,214,160,0.1)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#06D6A0' : 'var(--text-muted)',
                      border: `1px solid ${isActive ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.04)'}`,
                      fontWeight: 600, letterSpacing: '0.04em', cursor: 'default',
                    }}
                  >
                    {cat.label}
                  </span>
                );
              })}
            </div>
            <div className="viz-type-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: 8 }}>
              {CHART_TYPES.map(ct => {
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.id}
                    className={`viz-type-card ${studioChart === ct.id ? 'active' : ''}`}
                    onClick={() => setStudioChart(ct.id)}
                    style={{ padding: '10px 6px' }}
                  >
                    <span className="viz-type-icon"><Icon size={18} /></span>
                    <span className="viz-type-name">{ct.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOX 2: Data & Metrics */}
          <div className="viz-builder-box">
            <div className="viz-builder-box-header">
              <div className="viz-builder-step" style={{ '--step-color': '#3B82F6' }}>2</div>
              <div>
                <div className="viz-builder-box-title">Select Data</div>
                <div className="viz-builder-box-subtitle">Pick metrics to visualize</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {METRICS.map(m => {
                const active = selectedMetrics.includes(m);
                const color = METRIC_COLORS[m];
                return (
                  <button
                    key={m}
                    onClick={() => toggleMetric(m)}
                    className="viz-metric-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      background: active ? `${color}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer', transition: 'all 0.2s var(--ease-smooth)',
                      width: '100%', textAlign: 'left',
                      color: active ? color : 'var(--text-secondary)',
                    }}
                  >
                    {/* Custom checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: active ? color : 'transparent',
                      border: `2px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {active && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    {/* Color indicator */}
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: color, opacity: active ? 1 : 0.3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{m.replace('_', ' ')}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        {m === 'temperature' && 'Celsius (°C)'}
                        {m === 'humidity' && 'Percentage (%)'}
                        {m === 'aqi' && 'Air Quality Index'}
                        {m === 'rainfall' && 'Millimeters (mm)'}
                        {m === 'wind_speed' && 'Meters/sec (m/s)'}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.6 }}>{METRIC_UNITS[m]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOX 3: Compare Cities */}
          <div className="viz-builder-box">
            <div className="viz-builder-box-header">
              <div className="viz-builder-step" style={{ '--step-color': '#F59E0B' }}>3</div>
              <div>
                <div className="viz-builder-box-title">Compare Cities</div>
                <div className="viz-builder-box-subtitle">Overlay data from another city</div>
              </div>
            </div>
            {/* Compare toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 'var(--radius-sm)', marginBottom: 16,
              background: compareMode ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${compareMode ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              cursor: 'pointer', transition: 'all 0.25s',
            }} onClick={() => setCompareMode(!compareMode)}>
              {/* Toggle switch */}
              <div style={{
                width: 40, height: 22, borderRadius: 11, position: 'relative',
                background: compareMode ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.25s', flexShrink: 0,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: compareMode ? 21 : 3,
                  transition: 'left 0.25s var(--ease-smooth)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: compareMode ? '#F59E0B' : 'var(--text-secondary)' }}>Enable Comparison</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Side-by-side city data overlay</div>
              </div>
            </div>

            {/* City cards */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              {/* Primary city */}
              <div style={{
                flex: 1, padding: '16px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(6,214,160,0.05)', border: '1px solid rgba(6,214,160,0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Primary</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#06D6A0' }}>{selectedCity}</div>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: '#06D6A0', margin: '8px auto 0' }} />
              </div>

              {/* VS divider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: compareMode ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${compareMode ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: compareMode ? '#F59E0B' : 'var(--text-muted)',
                }}>
                  VS
                </div>
              </div>

              {/* Compare city */}
              <div style={{
                flex: 1, padding: '16px', borderRadius: 'var(--radius-sm)',
                background: compareMode ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${compareMode ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
                textAlign: 'center', opacity: compareMode ? 1 : 0.4,
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Compare</div>
                {compareMode ? (
                  <select
                    value={compareCity}
                    onChange={e => setCompareCity(e.target.value)}
                    style={{
                      fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#3B82F6',
                      background: 'transparent', border: 'none', textAlign: 'center', cursor: 'pointer',
                      width: '100%', outline: 'none',
                    }}
                  >
                    {CITIES.filter(c => c !== selectedCity).map(c => (
                      <option key={c} value={c} style={{ background: '#1C1C24', color: '#fff' }}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>—</div>
                )}
                <div style={{ width: 32, height: 3, borderRadius: 2, background: compareMode ? '#3B82F6' : 'rgba(255,255,255,0.1)', margin: '8px auto 0' }} />
              </div>
            </div>
          </div>

          {/* BOX 4: Customize Appearance */}
          <div className="viz-builder-box">
            <div className="viz-builder-box-header">
              <div className="viz-builder-step" style={{ '--step-color': '#EC4899' }}>4</div>
              <div>
                <div className="viz-builder-box-title">Customize</div>
                <div className="viz-builder-box-subtitle">Fine-tune appearance & style</div>
              </div>
            </div>

            {/* Color Theme */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Color Theme</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <div
                    key={key}
                    onClick={() => setColorTheme(key)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      background: colorTheme === key ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${colorTheme === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                      textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 6 }}>
                      {theme.colors.slice(0, 4).map((c, i) => (
                        <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, boxShadow: colorTheme === key ? `0 0 6px ${c}40` : 'none' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: colorTheme === key ? 'var(--text-primary)' : 'var(--text-muted)' }}>{theme.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle options */}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Options</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Grid Lines', desc: 'Show background grid', active: showGrid, toggle: () => setShowGrid(!showGrid) },
                { label: 'Legend', desc: 'Show data labels', active: showLegend, toggle: () => setShowLegend(!showLegend) },
                { label: 'Smooth Curves', desc: 'Interpolate line data', active: smoothCurve, toggle: () => setSmoothCurve(!smoothCurve) },
              ].map(opt => (
                <div
                  key={opt.label}
                  onClick={opt.toggle}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: opt.active ? 'rgba(236,72,153,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${opt.active ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Mini toggle */}
                  <div style={{
                    width: 32, height: 18, borderRadius: 9, position: 'relative', flexShrink: 0,
                    background: opt.active ? '#EC4899' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.25s',
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3,
                      left: opt.active ? 17 : 3,
                      transition: 'left 0.25s var(--ease-smooth)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: opt.active ? '#EC4899' : 'var(--text-secondary)' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Live Preview Canvas ── */}
        <div className="viz-canvas">
          <div className="viz-canvas-header">
            <div className="viz-canvas-title">
              {currentChartDef && <currentChartDef.icon size={16} style={{ color: colors[0] }} />}
              <span>{currentChartDef?.name} Chart — {selectedMetrics.map(m => m.replace('_', ' ')).join(', ')}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {compareMode && compareCity && (
                <div className="viz-compare-badge">
                  {selectedCity} <span className="viz-vs">VS</span> {compareCity}
                </div>
              )}
              <span className="viz-mini-badge">{selectedCity}</span>
              <span className="viz-mini-badge">{chartData.length} pts</span>
            </div>
          </div>
          <div style={{ height: 400 }} key={`${studioChart}-${selectedMetrics.join('-')}-${colorTheme}-${compareMode}-${compareCity}`} className="viz-chart-enter">
            {renderStudioChart()}
          </div>
        </div>
      </motion.div>

      {/* ─── Section 3: Advanced Analysis ─── */}
      <motion.div {...anim} transition={{ delay: 0.25 }}>
        <div className="viz-section-title">
          <Activity size={18} style={{ color: '#F59E0B' }} />
          <h2>Advanced Analysis</h2>
          <div className="viz-section-line" />
          <span className="viz-section-badge" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.15)' }}>ML POWERED</span>
        </div>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* PCA */}
        <motion.div {...anim} transition={{ delay: 0.3 }} className="glass-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#06D6A0' }} />
              Principal Component Analysis
            </div>
            {pcaData && <span className="viz-mini-badge">{(pcaData.total_explained * 100).toFixed(1)}% variance</span>}
          </div>
          <div style={{ height: 320 }}>
            {loading ? <div className="skeleton" style={{ width: '100%', height: '100%' }} /> : pcaData && (
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="pc1" name="PC1" tick={{ fill: '#6B7280', fontSize: 11 }} label={{ value: `PC1 (${(pcaData.explained_variance[0] * 100).toFixed(1)}%)`, fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis dataKey="pc2" name="PC2" tick={{ fill: '#6B7280', fontSize: 11 }} label={{ value: `PC2 (${(pcaData.explained_variance[1] * 100).toFixed(1)}%)`, fill: '#9CA3AF', fontSize: 11, angle: -90 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => val.toFixed(3)} />
                  <Scatter data={pcaData.points} fill="#06D6A0" fillOpacity={0.6} r={5} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          {pcaData?.loadings && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {pcaData.loadings.map((l, i) => (
                <div key={i} style={{ minWidth: '100px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: 2 }}>{l.feature.replace('_', ' ')}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    PC1: {l.pc1.toFixed(3)} | PC2: {l.pc2.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Clusters */}
        <motion.div {...anim} transition={{ delay: 0.35 }} className="glass-card">
          <div className="viz-hero-header">
            <div className="viz-hero-label">
              <div className="viz-dot" style={{ background: '#EC4899' }} />
              Climate Clustering (K-Means)
            </div>
            {clusterData?.clusters && <span className="viz-mini-badge">{clusterData.clusters.length} clusters</span>}
          </div>
          <div style={{ height: 320 }}>
            {loading ? <div className="skeleton" style={{ width: '100%', height: '100%' }} /> : clusterData && (
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="pc1" name="PC1" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis dataKey="pc2" name="PC2" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ ...tooltipStyle, padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.city}</div>
                          <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Cluster: {d.cluster_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Temp: {d.temperature}°C | Humidity: {d.humidity}%</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={clusterData.points}>
                    {clusterData.points.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={0.75} r={6} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          {clusterData?.clusters && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {clusterData.clusters.map((cl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cl.color }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{cl.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{cl.count} pts · {cl.avg_temperature}°C</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
