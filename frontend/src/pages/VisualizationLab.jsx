import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const CHART_TYPES = ['Line', 'Bar', 'Scatter', 'Area', 'PCA', 'Clusters'];
const METRICS = ['temperature', 'humidity', 'aqi', 'rainfall', 'wind_speed'];
const COLORS = ['#06D6A0', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'];
const anim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } };

export default function VisualizationLab() {
  const { selectedCity } = useApp();
  const [chartType, setChartType] = useState('Line');
  const [metric, setMetric] = useState('temperature');
  const [timeSeries, setTimeSeries] = useState(null);
  const [pcaData, setPca] = useState(null);
  const [clusterData, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const chartData = timeSeries?.labels?.map((label, i) => ({
    month: label,
    temperature: timeSeries.temperature?.[i],
    humidity: timeSeries.humidity?.[i],
    aqi: timeSeries.aqi?.[i],
    rainfall: timeSeries.rainfall?.[i],
    wind_speed: timeSeries.wind_speed?.[i],
  })) || [];

  const metricColor = { temperature: '#EF4444', humidity: '#3B82F6', aqi: '#F59E0B', rainfall: '#06D6A0', wind_speed: '#A855F7' };

  const renderChart = () => {
    const color = metricColor[metric] || '#06D6A0';

    if (chartType === 'PCA' && pcaData) {
      return (
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="pc1" name="PC1" tick={{ fill: '#6B7280', fontSize: 11 }} label={{ value: `PC1 (${(pcaData.explained_variance[0] * 100).toFixed(1)}%)`, fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis dataKey="pc2" name="PC2" tick={{ fill: '#6B7280', fontSize: 11 }} label={{ value: `PC2 (${(pcaData.explained_variance[1] * 100).toFixed(1)}%)`, fill: '#9CA3AF', fontSize: 12, angle: -90 }} />
            <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }}
              formatter={(val) => val.toFixed(3)} />
            <Scatter data={pcaData.points} fill="#06D6A0" fillOpacity={0.6} r={4} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'Clusters' && clusterData) {
      return (
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="pc1" name="PC1" tick={{ fill: '#6B7280', fontSize: 11 }} />
            <YAxis dataKey="pc2" name="PC2" tick={{ fill: '#6B7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#1F2937', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{d.city}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Cluster: {d.cluster_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Temp: {d.temperature}°C | Humidity: {d.humidity}%</div>
                  </div>
                );
              }}
            />
            <Scatter data={clusterData.points}>
              {clusterData.points.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} fillOpacity={0.7} r={5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'Bar') {
      return (
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
            <Bar dataKey={metric} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'Scatter') {
      const scatterData = chartData.map(d => ({ x: d.temperature, y: d[metric], month: d.month }));
      return (
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="x" name="Temperature" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis dataKey="y" name={metric} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
            <Scatter data={scatterData} fill={color} r={6} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'Area') {
      return (
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
            <Area type="monotone" dataKey={metric} stroke={color} fill="url(#areaGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Default: Line
    return (
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
          <Legend />
          <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div>
      <motion.div {...anim} className="page-header">
        <h1>Visualization Lab</h1>
        <p>Interactive climate data exploration — {selectedCity}</p>
      </motion.div>

      {/* Controls */}
      <motion.div {...anim} transition={{ delay: 0.05 }} style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div className="tab-bar">
          {CHART_TYPES.map(t => (
            <button key={t} className={`tab-item ${chartType === t ? 'active' : ''}`} onClick={() => setChartType(t)}>{t}</button>
          ))}
        </div>
        {!['PCA', 'Clusters'].includes(chartType) && (
          <div className="tab-bar">
            {METRICS.map(m => (
              <button key={m} className={`tab-item ${metric === m ? 'active' : ''}`} onClick={() => setMetric(m)}
                style={{ textTransform: 'capitalize' }}>
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Chart */}
      <motion.div {...anim} transition={{ delay: 0.1 }} className="glass-card" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>
          {chartType === 'PCA' ? 'Principal Component Analysis' : chartType === 'Clusters' ? 'Climate Clustering (K-Means)' : `${metric.replace('_', ' ')} — ${chartType} Chart`}
        </h3>
        <div style={{ height: '400px' }}>
          {loading ? <div className="skeleton" style={{ width: '100%', height: '100%' }} /> : renderChart()}
        </div>
      </motion.div>

      {/* Cluster Summaries */}
      {chartType === 'Clusters' && clusterData?.clusters && (
        <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
          {clusterData.clusters.map((cl, i) => (
            <motion.div key={i} {...anim} transition={{ delay: 0.15 + i * 0.05 }} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cl.color }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cl.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>{cl.count} data points</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Avg Temp: {cl.avg_temperature}°C<br />
                Avg Humidity: {cl.avg_humidity}%<br />
                Avg AQI: {cl.avg_aqi}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PCA Loadings */}
      {chartType === 'PCA' && pcaData?.loadings && (
        <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Feature Loadings</h3>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            {pcaData.loadings.map((l, i) => (
              <div key={i} style={{ minWidth: '120px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: '4px' }}>{l.feature.replace('_', ' ')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  PC1: {l.pc1.toFixed(3)} | PC2: {l.pc2.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
            Total variance explained: {(pcaData.total_explained * 100).toFixed(1)}%
          </div>
        </motion.div>
      )}

      {/* Multi-metric comparison */}
      {!['PCA', 'Clusters'].includes(chartType) && (
        <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>All Metrics Comparison</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' }} />
                <Legend />
                {METRICS.map((m, i) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={m.replace('_', ' ')} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
