import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Thermometer, Wind, CloudRain,
  AlertTriangle, Search, Layers, Star,
  ChevronRight, X, Filter, Droplets, Activity, TrendingUp,
  Compass, ZoomIn, ZoomOut, LocateFixed, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

// Setup heatmap plugin
window.L = L;
import 'leaflet.heat';

// ─── Constants ───────────────────────────────────────────────────────────────

const INDIA_CENTER = [22.0, 78.0];
const INITIAL_ZOOM = 5;

// Google Maps tile layers with API key
const GMAP_KEY = 'AIzaSyAjbpuUJcLdktAGnSgPPnpeoPrZhtKhl50';
const TILE_LAYERS = {
  dark: {
    url: `https://maps.googleapis.com/maps/vt?lyrs=r&x={x}&y={y}&z={z}&key=${GMAP_KEY}&style=feature:all|element:geometry|color:0x212121&style=feature:all|element:labels.text.fill|color:0x757575&style=feature:all|element:labels.text.stroke|color:0x212121&style=feature:water|element:geometry|color:0x000000&style=feature:road|element:geometry.fill|color:0x2c2c2c`,
    label: 'Dark',
  },
  roadmap: {
    url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}`,
    label: 'Roadmap',
    subdomains: '0123',
  },
  satellite: {
    url: `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`,
    label: 'Satellite',
    subdomains: '0123',
  },
  hybrid: {
    url: `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`,
    label: 'Hybrid',
    subdomains: '0123',
  },
  terrain: {
    url: `https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}`,
    label: 'Terrain',
    subdomains: '0123',
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getRiskColor = (score) => {
  if (score >= 75) return '#EF4444';
  if (score >= 50) return '#F97316';
  if (score >= 30) return '#F59E0B';
  if (score >= 15) return '#3B82F6';
  return '#06D6A0';
};

const getAqiColor = (aqi) => {
  if (aqi > 300) return '#EF4444';
  if (aqi > 200) return '#F97316';
  if (aqi > 100) return '#F59E0B';
  if (aqi > 50) return '#3B82F6';
  return '#06D6A0';
};

function getAqiCategory(aqi) {
  if (!aqi) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getConditionEmoji(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('clear')) return '☀️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('rain')) return '🌧️';
  if (c.includes('haze') || c.includes('smoke') || c.includes('mist')) return '🌫️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('thunder')) return '⛈️';
  return '🌤️';
}

function createPulseIcon(color, isSelected = false) {
  const size = isSelected ? 44 : 30;
  const inner = isSelected ? 14 : 8;
  const mid = isSelected ? 24 : 16;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${isSelected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" opacity="0.15"><animate attributeName="r" from="${size / 2 - 4}" to="${size / 2}" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite"/></circle>` : ''}
      <circle cx="${size / 2}" cy="${size / 2}" r="${mid / 2}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="1"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${inner / 2}" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'leaflet-pulse-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

const anim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapView() {
  const { selectedCity, setSelectedCity } = useApp();

  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [aqiFilter, setAqiFilter] = useState([0, 500]);
  const [tempFilter, setTempFilter] = useState([-5, 50]);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [tileLayer, setTileLayer] = useState('dark');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [mapStats, setMapStats] = useState({ avgTemp: 0, avgAqi: 0, cities: 0 });

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: INITIAL_ZOOM,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[4, 65], [38, 100]],
      maxBoundsViscosity: 0.8,
    });

    const tile = L.tileLayer(TILE_LAYERS.dark.url, {
      maxZoom: 18,
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    tileLayerRef.current = tile;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_LAYERS[tileLayer].url);
  }, [tileLayer]);

  // Click-to-Explore Feature (Infinite Map)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    const handleMapClick = async (e) => {
      const { lat, lng } = e.latlng;
      if (window.isExploringMap) return;
      window.isExploringMap = true;
      
      try {
        const customMarker = await api.exploreLocation(lat, lng, "Explored Area");
        setMapData(prev => {
          if (!prev) return prev;
          // Keep only the newly explored pin alongside the default markers
          // We filter by checking if it was a previously explored area name
          // Since the name is dynamic now, it's better to just keep it or slice if it grows too large.
          return { ...prev, markers: [customMarker, ...prev.markers] };
        });
        setSelectedMarker(customMarker);
        map.flyTo([lat, lng], 10, { animate: true, duration: 1.5 });
      } catch (err) {
        console.error("Explore location error:", err);
      } finally {
        window.isExploringMap = false;
      }
    };
    
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapInstanceRef.current]); // Only bind once when map is ready

  // Fetch data
  useEffect(() => {
    api.getMapData()
      .then(data => {
        setMapData(data);
        const markers = data?.markers || [];
        setFilteredMarkers(markers);
        computeRecommendation(markers);
        computeStats(markers);

        if (selectedCity) {
          const match = markers.find(m => m.city.toLowerCase() === selectedCity.toLowerCase());
          if (match) setSelectedMarker(match);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Apply filters
  useEffect(() => {
    if (!mapData?.markers) return;
    const filtered = mapData.markers.filter(m => {
      const aqi = m.aqi || 0;
      const temp = m.temperature || 0;
      return aqi >= aqiFilter[0] && aqi <= aqiFilter[1]
        && temp >= tempFilter[0] && temp <= tempFilter[1]
        && m.city.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredMarkers(filtered);
    computeStats(filtered);
  }, [mapData, aqiFilter, tempFilter, searchQuery]);

  // Render markers on map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    filteredMarkers.forEach(cityData => {
      const isSelected = selectedMarker?.city === cityData.city;
      const riskColor = cityData.risk_color || getRiskColor(cityData.risk_score || 0);

      const marker = L.marker([cityData.lat, cityData.lon], {
        icon: createPulseIcon(riskColor, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      // Popup content
      const aqiColor = getAqiColor(cityData.aqi || 0);
      const emoji = getConditionEmoji(cityData.condition);

      marker.bindPopup(`
        <div style="font-family:'Space Grotesk',sans-serif;background:#1A1A24;color:#fff;border-radius:16px;padding:18px 22px;min-width:260px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 60px rgba(0,0,0,0.6)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <div style="width:12px;height:12px;border-radius:50%;background:${riskColor};box-shadow:0 0 10px ${riskColor}"></div>
            <span style="font-size:1.15rem;font-weight:700;flex:1">${cityData.city}</span>
            <span style="font-size:1.5rem">${emoji}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.3rem;font-weight:700;color:#F59E0B">${cityData.temperature || '--'}°</div>
              <div style="font-size:0.6rem;color:#65657a;text-transform:uppercase;margin-top:2px">Temp</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.3rem;font-weight:700;color:${aqiColor}">${cityData.aqi?.toFixed?.(0) || '--'}</div>
              <div style="font-size:0.6rem;color:#65657a;text-transform:uppercase;margin-top:2px">AQI</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.3rem;font-weight:700;color:#3B82F6">${cityData.humidity || '--'}%</div>
              <div style="font-size:0.6rem;color:#65657a;text-transform:uppercase;margin-top:2px">Humid</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="background:rgba(99,102,241,0.12);color:#818cf8;border-radius:20px;padding:4px 10px;font-size:0.72rem;font-weight:600">${cityData.aqi_label || getAqiCategory(cityData.aqi)}</span>
            <span style="background:${riskColor}20;color:${riskColor};border-radius:20px;padding:4px 10px;font-size:0.72rem;font-weight:600">${cityData.risk_level || 'Unknown'} Risk</span>
          </div>
        </div>
      `, {
        className: 'leaflet-clean-popup',
        closeButton: false,
        maxWidth: 300,
        offset: [0, -10],
      });

      marker.on('click', () => {
        setSelectedMarker(cityData);
        setSelectedCity(cityData.city);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [filteredMarkers, selectedMarker, setSelectedCity]);

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (heatmapLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }
    if (showHeatmap && filteredMarkers.length > 0) {
      const data = filteredMarkers
        .filter(m => m.lat && m.lon && m.aqi)
        .map(m => [m.lat, m.lon, m.aqi / 50]);
      heatmapLayerRef.current = L.heatLayer(data, {
        radius: 45,
        blur: 30,
        maxZoom: 12,
        max: 5,
        gradient: {
          0.1: 'rgba(6, 214, 160, 0.5)',
          0.3: '#3B82F6',
          0.5: '#F59E0B',
          0.8: '#F97316',
          1.0: '#EF4444',
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [showHeatmap, filteredMarkers]);

  // Fly to selected marker
  useEffect(() => {
    if (selectedMarker && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedMarker.lat, selectedMarker.lon], 10, {
        duration: 1.2,
        easeLinearity: 0.3,
      });
    }
  }, [selectedMarker]);

  function computeRecommendation(markers) {
    if (!markers.length) return;
    const best = markers.reduce((acc, m) => {
      const score = (100 - (m.aqi || 0) / 5) + (30 - Math.abs((m.temperature || 25) - 25));
      return score > acc.score ? { ...m, score } : acc;
    }, { score: -Infinity });
    setRecommendation(best);
  }

  function computeStats(markers) {
    if (!markers.length) return;
    const avgTemp = (markers.reduce((s, m) => s + (m.temperature || 0), 0) / markers.length).toFixed(1);
    const avgAqi = (markers.reduce((s, m) => s + (m.aqi || 0), 0) / markers.length).toFixed(1);
    setMapStats({ avgTemp, avgAqi, cities: markers.length });
  }

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_CENTER, INITIAL_ZOOM, { duration: 1 });
      setSelectedMarker(null);
      setSearchQuery('');
    }
  };

  const handleCityClick = useCallback((cityData) => {
    setSelectedMarker(cityData);
    setSelectedCity(cityData.city);
  }, [setSelectedCity]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Header */}
      <motion.div {...anim} className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Climate Intelligence Map</h1>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, rgba(6,214,160,0.12), rgba(59,130,246,0.12))',
                border: '1px solid rgba(6,214,160,0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.82rem', color: '#06D6A0', fontWeight: 600,
              }}
            >
              <Star size={13} fill="#06D6A0" />
              Best today: {recommendation.city}
            </motion.div>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Live India climate data — click markers to explore · {mapStats.cities} cities tracked
        </p>
      </motion.div>

      {/* Live Stats Bar */}
      <motion.div {...anim} transition={{ delay: 0.05 }} style={{
        display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap',
      }}>
        {[
          { icon: <Compass size={14} />, label: 'Cities Tracked', value: mapStats.cities, color: '#06D6A0' },
          { icon: <Thermometer size={14} />, label: 'Avg Temperature', value: `${mapStats.avgTemp}°C`, color: '#F59E0B' },
          { icon: <Wind size={14} />, label: 'Avg AQI', value: mapStats.avgAqi, color: getAqiColor(parseFloat(mapStats.avgAqi) || 0) },
          { icon: <Activity size={14} />, label: 'Data Source', value: 'Live API', color: '#3B82F6' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 140,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(28,28,36,0.45)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          }}>
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', minHeight: '680px', flex: 1 }}>
        {/* Map Column */}
        <motion.div {...anim} transition={{ delay: 0.08 }} style={{
          position: 'relative', borderRadius: 'var(--radius-xl)',
          overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)', background: '#0A0A0F',
        }}>
          {/* Top-Center Search Bar (Google Maps Style) */}
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, width: 420, maxWidth: 'calc(100% - 40px)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(18, 18, 25, 0.75)', backdropFilter: 'blur(24px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
              padding: '12px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease',
            }}>
              <Search size={18} style={{ color: '#06D6A0', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search global cities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.95rem', width: '100%',
                  fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.02em'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a0a0b0', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', transition: '0.2s' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Right Controls (Floating Dock) */}
          <div style={{
            position: 'absolute', top: 20, right: 20, zIndex: 1000,
            display: 'flex', flexDirection: 'column', gap: 6,
            background: 'rgba(18, 18, 25, 0.6)', backdropFilter: 'blur(20px)',
            padding: 6, borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {[
              { icon: <ZoomIn size={18} />, action: () => mapInstanceRef.current?.zoomIn(), tip: 'Zoom In' },
              { icon: <ZoomOut size={18} />, action: () => mapInstanceRef.current?.zoomOut(), tip: 'Zoom Out' },
              { icon: <LocateFixed size={18} />, action: resetView, tip: 'Reset View' },
              { divider: true },
              { icon: <Layers size={18} />, action: () => setShowLayerPicker(p => !p), tip: 'Map Style', active: showLayerPicker },
              { icon: showHeatmap ? <EyeOff size={18} /> : <Eye size={18} />, action: () => setShowHeatmap(h => !h), tip: 'Heatmap', active: showHeatmap },
            ].map((btn, i) => btn.divider ? (
              <div key={i} style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
            ) : (
              <button key={i} title={btn.tip} onClick={btn.action}
                className="map-control-btn"
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: btn.active ? 'rgba(6,214,160,0.15)' : 'transparent',
                  color: btn.active ? '#06D6A0' : '#a0a0b0', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {btn.icon}
              </button>
            ))}
            
            {/* Elegant Layer Picker Popout */}
            <AnimatePresence>
              {showLayerPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', top: 0, right: 60,
                    background: 'rgba(18, 18, 25, 0.85)', backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                    padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
                    width: 140, boxShadow: '-8px 12px 40px rgba(0,0,0,0.5)',
                  }}>
                  <div style={{ fontSize: '0.65rem', color: '#65657a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 8px' }}>
                    Map Style
                  </div>
                  {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                    <button key={key}
                      onClick={() => { setTileLayer(key); setShowLayerPicker(false); }}
                      style={{
                        padding: '10px 12px', borderRadius: 10, border: 'none',
                        background: tileLayer === key ? 'rgba(6,214,160,0.12)' : 'transparent',
                        color: tileLayer === key ? '#06D6A0' : '#a0a0b0',
                        fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8
                      }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: tileLayer === key ? '#06D6A0' : 'transparent' }} />
                      {layer.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls Area (Legend & Timeline) */}
          <div style={{
            position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000,
            display: 'flex', gap: 20, alignItems: 'flex-end', pointerEvents: 'none',
          }}>
            
            {/* Floating Risk Legend Mini-Card */}
            <div style={{
              background: 'rgba(18, 18, 25, 0.75)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
              padding: '14px 16px', pointerEvents: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)', width: 140,
            }}>
              <div style={{ fontSize: '0.65rem', color: '#8a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Risk Index
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { color: '#06D6A0', label: 'Minimal' },
                  { color: '#3B82F6', label: 'Low' },
                  { color: '#F59E0B', label: 'Moderate' },
                  { color: '#F97316', label: 'High' },
                  { color: '#EF4444', label: 'Extreme' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem', color: '#c0c0d0', fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 8px ${l.color}80` }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Innovative Floating Timeline Slider */}
            <div style={{
              flex: 1, background: 'rgba(18, 18, 25, 0.75)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
              padding: '12px 24px', pointerEvents: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 24,
            }}>
              {/* Current Date Display */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 60 }}>
                <span style={{ fontSize: '0.6rem', color: '#8a8a9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Forecast
                </span>
                <span style={{ fontSize: '1.05rem', color: '#06D6A0', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {MONTHS[activeMonth]} '26
                </span>
              </div>
              
              {/* Divider */}
              <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }} />

              {/* Slider Track */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                {/* Horizontal connection line */}
                <div style={{ position: 'absolute', left: 10, right: 10, height: 2, background: 'rgba(255,255,255,0.1)', top: '50%', transform: 'translateY(-50%)', borderRadius: 2 }} />
                
                {MONTHS.map((m, i) => {
                  const isActive = activeMonth === i;
                  const isPast = i < activeMonth;
                  return (
                    <div key={m}
                      onClick={(e) => { e.stopPropagation(); setActiveMonth(i); }}
                      style={{
                        position: 'relative', zIndex: 2, cursor: 'pointer',
                        padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        group: 'timeline-node'
                      }}>
                      {/* Interactive Node */}
                      <div style={{
                        width: isActive ? 14 : 8, height: isActive ? 14 : 8,
                        borderRadius: '50%', background: isActive ? '#06D6A0' : (isPast ? '#06D6A0' : '#45455a'),
                        border: isActive ? '3px solid rgba(18,18,25,0.9)' : '2px solid rgba(18,18,25,0.8)',
                        boxShadow: isActive ? '0 0 0 1px #06D6A0, 0 0 12px rgba(6,214,160,0.5)' : 'none',
                        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }} />
                      {/* Label */}
                      <span style={{
                        position: 'absolute', top: 28,
                        color: isActive ? '#fff' : '#65657a', fontSize: '0.68rem', fontWeight: isActive ? 700 : 500,
                        transition: 'color 0.2s', fontFamily: 'var(--font-mono)', opacity: isActive ? 1 : 0.6
                      }}>
                        {m.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, flexDirection: 'column', gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(6,214,160,0.1)',
                borderTopColor: '#06D6A0',
                animation: 'mapSpin 0.9s linear infinite',
              }} />
              <div style={{ color: '#06D6A0', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronizing Satellites...</div>
            </div>
          )}

          {/* Map container */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 680 }} />
        </motion.div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', maxHeight: 680 }}>

          {/* Smart Recommendation */}
          {recommendation && (
            <motion.div {...anim} transition={{ delay: 0.1 }}
              style={{
                background: 'linear-gradient(135deg, rgba(6,214,160,0.08), rgba(59,130,246,0.06))',
                border: '1px solid rgba(6,214,160,0.2)',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                flexShrink: 0, cursor: 'pointer',
              }}
              onClick={() => handleCityClick(recommendation)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #06D6A0, #3B82F6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={14} color="#0f0f17" />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#65657a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Smart Pick</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#06D6A0' }}>{recommendation.city}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>{recommendation.temperature}°</div>
                  <div style={{ fontSize: '0.6rem', color: '#65657a' }}>Temp</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getAqiColor(recommendation.aqi || 0) }}>{recommendation.aqi?.toFixed?.(0) || '--'}</div>
                  <div style={{ fontSize: '0.6rem', color: '#65657a' }}>AQI</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3B82F6' }}>{recommendation.humidity || '--'}%</div>
                  <div style={{ fontSize: '0.6rem', color: '#65657a' }}>Humid</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div {...anim} transition={{ delay: 0.15 }} className="glass-card" style={{ padding: '14px 16px', flexShrink: 0 }}>
            <button onClick={() => setShowFilters(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)',
                cursor: 'pointer', padding: 0,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a' }}>
                <Filter size={13} /> Filters
                {(aqiFilter[1] < 500 || tempFilter[0] > -5) && (
                  <span style={{ background: 'rgba(6,214,160,0.2)', color: '#06D6A0', borderRadius: 10, padding: '1px 7px', fontSize: '0.62rem' }}>Active</span>
                )}
              </div>
              <ChevronRight size={14} style={{ color: '#65657a', transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: '#a0a0b0' }}>Max AQI</span>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: getAqiColor(aqiFilter[1]) }}>{aqiFilter[1]}</span>
                      </div>
                      <input type="range" min={0} max={500} step={10} value={aqiFilter[1]}
                        onChange={e => setAqiFilter([0, +e.target.value])}
                        style={{ width: '100%', accentColor: '#06D6A0' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: '#a0a0b0' }}>Min Temp</span>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>{tempFilter[0]}°C</span>
                      </div>
                      <input type="range" min={-5} max={50} step={1} value={tempFilter[0]}
                        onChange={e => setTempFilter([+e.target.value, 50])}
                        style={{ width: '100%', accentColor: '#F59E0B' }} />
                    </div>
                    <button onClick={() => { setAqiFilter([0, 500]); setTempFilter([-5, 50]); }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 7, fontSize: '0.78rem', color: '#a0a0b0', cursor: 'pointer', width: '100%' }}>
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Selected City Detail */}
          <AnimatePresence mode="wait">
            {selectedMarker ? (
              <motion.div key={selectedMarker.city}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                className="glass-card" style={{ padding: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `linear-gradient(135deg, ${selectedMarker.risk_color || '#06D6A0'}, ${selectedMarker.risk_color || '#3B82F6'}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 16px ${selectedMarker.risk_color || '#06D6A0'}33`,
                  }}>
                    <MapPin size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>{selectedMarker.city}</div>
                    <div style={{ fontSize: '0.72rem', color: '#65657a', fontFamily: 'var(--font-mono)' }}>
                      {selectedMarker.lat?.toFixed(2)}°N · {selectedMarker.lon?.toFixed(2)}°E
                    </div>
                  </div>
                  <span style={{ fontSize: '1.8rem' }}>{getConditionEmoji(selectedMarker.condition)}</span>
                  <button onClick={() => setSelectedMarker(null)}
                    style={{ background: 'none', border: 'none', color: '#65657a', cursor: 'pointer', padding: 0 }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <StatMini icon={<Thermometer size={13} />} label="Temperature" value={`${selectedMarker.temperature || '--'}°C`} color="#F59E0B" />
                  <StatMini icon={<Activity size={13} />} label="AQI" value={selectedMarker.aqi?.toFixed?.(0) || '--'} color={getAqiColor(selectedMarker.aqi || 0)} />
                  <StatMini icon={<Droplets size={13} />} label="Humidity" value={`${selectedMarker.humidity || '--'}%`} color="#3B82F6" />
                  <StatMini icon={<AlertTriangle size={13} />} label="Risk" value={selectedMarker.risk_level || '--'} color={selectedMarker.risk_color || '#06D6A0'} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: `${getAqiColor(selectedMarker.aqi || 0)}20`,
                    color: getAqiColor(selectedMarker.aqi || 0),
                    borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
                    border: `1px solid ${getAqiColor(selectedMarker.aqi || 0)}40`,
                  }}>
                    <Wind size={11} />
                    {selectedMarker.aqi_label || getAqiCategory(selectedMarker.aqi)} · {selectedMarker.condition}
                  </span>
                </div>

                {selectedMarker.tourist_places?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a', marginBottom: 8 }}>
                      Tourist Attractions
                    </div>
                    {selectedMarker.tourist_places.slice(0, 4).map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', color: '#a0a0b0' }}>
                        <Navigation size={11} style={{ color: '#06D6A0', flexShrink: 0 }} />
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card" style={{ textAlign: 'center', padding: '28px 16px', flexShrink: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <MapPin size={22} style={{ color: '#65657a' }} />
                </div>
                <p style={{ color: '#65657a', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Click on a city marker to see detailed climate & travel information
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* City List */}
          <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card" style={{ flex: 1, padding: 14, overflow: 'auto', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a' }}>
                Cities ({filteredMarkers.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredMarkers.map(m => {
                const isSelected = selectedMarker?.city === m.city;
                return (
                  <button key={m.city} onClick={() => handleCityClick(m)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: isSelected ? 'rgba(6,214,160,0.08)' : 'transparent',
                      color: 'var(--text-primary)', fontSize: '0.85rem',
                      transition: 'background 0.15s', fontFamily: 'var(--font-body)',
                      outline: isSelected ? '1px solid rgba(6,214,160,0.2)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.risk_color || '#06D6A0', boxShadow: `0 0 5px ${m.risk_color || '#06D6A0'}` }} />
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{m.city}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>{m.temperature}°</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: getAqiColor(m.aqi || 0) }}>
                        AQI {m.aqi?.toFixed?.(0) || '--'}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredMarkers.length === 0 && (
                <div style={{ textAlign: 'center', color: '#65657a', fontSize: '0.85rem', padding: 20 }}>
                  No cities match your filters
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Internal CSS */}
      <style>{`
        @keyframes mapSpin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #0f0f17 !important; font-family: var(--font-body); }
        .leaflet-clean-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 0 !important; }
        .leaflet-clean-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-clean-popup .leaflet-popup-tip-container { display: none !important; }
        .leaflet-pulse-icon { background: transparent !important; border: none !important; }
        .leaflet-control-attribution { display: none !important; }
      `}</style>
    </div>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 10, padding: 10, textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#65657a' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}
