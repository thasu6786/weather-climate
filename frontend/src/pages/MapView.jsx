import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, Navigation, Thermometer, Wind, CloudRain,
  AlertTriangle, Search, Layers, Sliders, Star,
  ChevronRight, X, Filter, Droplets, Activity, TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

// Fix for leaflet.heat in Vite (requires window.L to be set before loading)
window.L = L;
import 'leaflet.heat';

// ─── Constants ───────────────────────────────────────────────────────────────

const INDIA_CENTER = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;

const INDIA_BOUNDS = [
  [6.7, 68.2], // South-West
  [37.1, 97.5] // North-East
];

// Dark tile theme (CartoDB Dark Matter)
const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
  if (aqi > 50)  return '#3B82F6';
  return '#06D6A0';
};

function createCustomIcon(color, isSelected = false) {
  const size = isSelected ? 40 : 28;
  const pulseSize = isSelected ? size + 16 : size;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${pulseSize}" height="${pulseSize}" viewBox="0 0 ${pulseSize} ${pulseSize}">
      ${isSelected ? `<circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${pulseSize/2}" fill="${color}" opacity="0.2"/>` : ''}
      <circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${size/2}" fill="${color}" opacity="0.4" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${pulseSize/2}" cy="${pulseSize/2}" r="${size/4}" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-icon',
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize/2, pulseSize/2],
    popupAnchor: [0, -(pulseSize/2)]
  });
}

// ─── Map Controller Component ────────────────────────────────────────────────
const MapController = ({ selectedMarker, indiaBounds, showHeatmap, filteredMarkers }) => {
  const map = useMap();
  const heatmapLayerRef = useRef(null);

  // Handle zooming to marker
  useEffect(() => {
    if (selectedMarker) {
      map.flyTo([selectedMarker.lat, selectedMarker.lon], 11, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedMarker, map]);

  // Handle heatmap
  useEffect(() => {
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
    }
    
    if (showHeatmap && filteredMarkers.length > 0) {
      const data = filteredMarkers
        .filter(m => m.lat && m.lon && m.aqi)
        .map(m => [m.lat, m.lon, m.aqi / 100]); // scale AQI roughly
        
      heatmapLayerRef.current = L.heatLayer(data, {
        radius: 40,
        blur: 35,
        maxZoom: 12,
        max: 5,
        gradient: {
          0.1: 'rgba(0, 255, 180, 0.5)',
          0.3: '#3B82F6',
          0.5: '#F59E0B',
          0.8: '#F97316',
          1.0: '#EF4444'
        }
      }).addTo(map);
    }

    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
    };
  }, [showHeatmap, filteredMarkers, map]);

  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapView() {
  const { selectedCity, setSelectedCity } = useApp();

  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [aqiFilter, setAqiFilter] = useState([0, 500]);
  const [tempFilter, setTempFilter] = useState([-5, 50]);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [filteredMarkers, setFilteredMarkers] = useState([]);

  // Fetch data
  useEffect(() => {
    api.getMapData()
      .then(data => {
        setMapData(data);
        setFilteredMarkers(data?.markers || []);
        computeRecommendation(data?.markers || []);
        
        // Auto-select initial city if matched
        if (selectedCity) {
          const match = data?.markers?.find(m => m.city.toLowerCase() === selectedCity.toLowerCase());
          if (match) setSelectedMarker(match);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function computeRecommendation(markers) {
    if (!markers.length) return;
    const best = markers.reduce((acc, m) => {
      const score = (100 - (m.aqi || 0) / 5) + (30 - Math.abs((m.temperature || 25) - 25));
      return score > acc.score ? { ...m, score } : acc;
    }, { score: -Infinity });
    setRecommendation(best);
  }

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
  }, [mapData, aqiFilter, tempFilter, searchQuery]);

  // Handle marker click
  const handleMarkerClick = useCallback((cityData) => {
    setSelectedMarker(cityData);
    setSelectedCity(cityData.city);
  }, [setSelectedCity]);

  // Map resetter
  const mapRef = useRef(null);
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(INDIA_CENTER, INITIAL_ZOOM);
      setSelectedMarker(null);
      setSearchQuery('');
    }
  };

  function getAqiCategory(aqi) {
    if (!aqi) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  function getRiskBg(score) {
    if (!score) return 'rgba(6,214,160,0.15)';
    if (score >= 75) return 'rgba(239,68,68,0.15)';
    if (score >= 50) return 'rgba(249,115,22,0.15)';
    if (score >= 30) return 'rgba(245,158,11,0.15)';
    if (score >= 15) return 'rgba(59,130,246,0.15)';
    return 'rgba(6,214,160,0.15)';
  }

  const handleCityListClick = (cityData) => {
    handleMarkerClick(cityData);
  };

  const anim = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* ── Header ── */}
      <motion.div {...anim} className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Interactive India Map</h1>
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
          Click any city marker to zoom in. Powered by Leaflet & OpenStreetMap.
        </p>
      </motion.div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', minHeight: '680px', flex: 1 }}>

        {/* ── Map Column ── */}
        <motion.div
          {...anim}
          transition={{ delay: 0.05 }}
          style={{
            position: 'relative', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            background: '#0f0f17'
          }}
        >
          {/* Search bar overlay */}
          <div style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, width: '380px', maxWidth: 'calc(100% - 32px)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(15,15,23,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)',
              padding: '10px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <Search size={16} style={{ color: '#06D6A0', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.9rem', width: '100%',
                  fontFamily: 'var(--font-body)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#65657a', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Map layer controls overlay */}
          <div style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <button
              onClick={() => setShowHeatmap(h => !h)}
              title="Toggle Heatmap"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: showHeatmap ? 'rgba(6,214,160,0.2)' : 'rgba(15,15,23,0.88)',
                border: `1px solid ${showHeatmap ? 'rgba(6,214,160,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: showHeatmap ? '#06D6A0' : '#a0a0b0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(12px)',
              }}
            >
              <Layers size={17} />
            </button>
            <button
              onClick={resetView}
              title="Reset View"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(15,15,23,0.88)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0b0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(12px)',
              }}
            >
              <Navigation size={17} />
            </button>
          </div>

          {/* Risk Legend overlay */}
          <div style={{
            position: 'absolute', bottom: '70px', left: '16px', zIndex: 1000,
            background: 'rgba(15,15,23,0.88)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#65657a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Risk Level
            </div>
            {[
              { color: '#06D6A0', label: 'Minimal' },
              { color: '#3B82F6', label: 'Low' },
              { color: '#F59E0B', label: 'Moderate' },
              { color: '#F97316', label: 'High' },
              { color: '#EF4444', label: 'Extreme' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', marginBottom: '4px', color: '#a0a0b0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Month slider overlay */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 1000,
            background: 'rgba(15,15,23,0.88)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            padding: '12px 16px',
            pointerEvents: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#65657a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Time Period
              </span>
              <span style={{ fontSize: '0.82rem', color: '#06D6A0', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {MONTHS[activeMonth]} 2025
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={(e) => { e.stopPropagation(); setActiveMonth(i); }}
                  style={{
                    flex: 1, padding: '5px 2px', borderRadius: '6px',
                    background: activeMonth === i ? 'rgba(6,214,160,0.25)' : 'transparent',
                    border: `1px solid ${activeMonth === i ? 'rgba(6,214,160,0.5)' : 'transparent'}`,
                    color: activeMonth === i ? '#06D6A0' : '#45455a',
                    fontSize: '0.58rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {m.slice(0, 1)}
                </button>
              ))}
            </div>
          </div>

          {/* React Leaflet Map */}
          {(!loading && filteredMarkers.length > 0) ? (
            <MapContainer 
              center={INDIA_CENTER} 
              zoom={INITIAL_ZOOM} 
              style={{ width: '100%', height: '100%', minHeight: '680px', background: '#0f0f17' }}
              zoomControl={false}
              maxBounds={INDIA_BOUNDS}
              ref={mapRef}
            >
              <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />
              <MapController 
                selectedMarker={selectedMarker} 
                indiaBounds={INDIA_BOUNDS} 
                showHeatmap={showHeatmap}
                filteredMarkers={filteredMarkers}
              />
              
              {filteredMarkers.map((cityData) => {
                const isSelected = selectedMarker?.city === cityData.city;
                const riskColor = cityData.risk_color || getRiskColor(cityData.risk_score || 0);
                const aqiColor = getAqiColor(cityData.aqi || 0);
                const aqiLabel = cityData.aqi_label || getAqiCategory(cityData.aqi);

                return (
                  <Marker 
                    key={cityData.city}
                    position={[cityData.lat, cityData.lon]}
                    icon={createCustomIcon(riskColor, isSelected)}
                    eventHandlers={{ click: () => handleMarkerClick(cityData) }}
                    zIndexOffset={isSelected ? 1000 : 0}
                  >
                    <Popup className="custom-leaflet-popup" closeButton={false}>
                      <div style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        background: '#1C1C24',
                        color: '#fff',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        minWidth: '240px',
                        cursor: 'default'
                      }} onClick={(e) => e.stopPropagation()}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:riskColor,boxShadow:`0 0 8px ${riskColor}`}}></div>
                          <span style={{fontSize:'1.1rem',fontWeight:700}}>{cityData.city}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                            <div style={{fontSize:'1.4rem',fontWeight:700,color:'#F59E0B'}}>{cityData.temperature || '--'}°</div>
                            <div style={{fontSize:'0.65rem',color:'#65657a',marginTop:'2px',textTransform:'uppercase'}}>Temp</div>
                          </div>
                          <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                            <div style={{fontSize:'1.4rem',fontWeight:700,color:aqiColor}}>{cityData.aqi || '--'}</div>
                            <div style={{fontSize:'0.65rem',color:'#65657a',marginTop:'2px',textTransform:'uppercase'}}>AQI</div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'8px'}}>
                          <span style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',borderRadius:'20px',padding:'4px 10px',fontSize:'0.75rem',fontWeight:600}}>{aqiLabel}</span>
                          <span style={{background:getRiskBg(cityData.risk_score),color:riskColor,borderRadius:'20px',padding:'4px 10px',fontSize:'0.75rem',fontWeight:600}}>{cityData.risk_level || 'Unknown'} Risk</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div style={{
              position: 'absolute', inset: 0, background: '#0f0f17',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 20, flexDirection: 'column', gap: '16px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                border: '3px solid rgba(6,214,160,0.2)',
                borderTopColor: '#06D6A0',
                animation: 'spin 0.9s linear infinite',
              }} />
              <span style={{ color: '#65657a', fontSize: '0.9rem' }}>
                Loading live geography...
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto', maxHeight: '680px' }}>
          
          {/* Smart Recommendation */}
          {recommendation && (
            <motion.div
              {...anim}
              transition={{ delay: 0.1 }}
              style={{
                background: 'linear-gradient(135deg, rgba(6,214,160,0.08), rgba(59,130,246,0.06))',
                border: '1px solid rgba(6,214,160,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              onClick={() => handleCityListClick(recommendation)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06D6A0, #3B82F6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={14} color="#0f0f17" />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#65657a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Smart Pick</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#06D6A0' }}>{recommendation.city}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>{recommendation.temperature}°</div>
                  <div style={{ fontSize: '0.65rem', color: '#65657a' }}>Temp</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getAqiColor(recommendation.aqi || 0) }}>{recommendation.aqi || '--'}</div>
                  <div style={{ fontSize: '0.65rem', color: '#65657a' }}>AQI</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div {...anim} transition={{ delay: 0.15 }} className="glass-card" style={{ padding: '14px 16px', flexShrink: 0 }}>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)',
                cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a' }}>
                <Filter size={13} />
                Filters
                {(aqiFilter[1] < 500 || tempFilter[0] > -5) && (
                  <span style={{ background: 'rgba(6,214,160,0.2)', color: '#06D6A0', borderRadius: '10px', padding: '1px 7px', fontSize: '0.65rem' }}>Active</span>
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
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a0a0b0' }}>Max AQI</span>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: getAqiColor(aqiFilter[1]) }}>{aqiFilter[1]}</span>
                      </div>
                      <input
                        type="range" min={0} max={500} step={10} value={aqiFilter[1]}
                        onChange={e => setAqiFilter([0, +e.target.value])}
                        style={{ width: '100%', accentColor: '#06D6A0' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a0a0b0' }}>Min Temp</span>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>{tempFilter[0]}°C</span>
                      </div>
                      <input
                        type="range" min={-5} max={50} step={1} value={tempFilter[0]}
                        onChange={e => setTempFilter([+e.target.value, 50])}
                        style={{ width: '100%', accentColor: '#F59E0B' }}
                      />
                    </div>
                    <button
                      onClick={() => { setAqiFilter([0, 500]); setTempFilter([-5, 50]); }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px', fontSize: '0.78rem', color: '#a0a0b0', cursor: 'pointer', width: '100%' }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Selected City Info */}
          <AnimatePresence mode="wait">
            {selectedMarker ? (
              <motion.div
                key={selectedMarker.city}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="glass-card"
                style={{ padding: '16px', flexShrink: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
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
                  <button
                    onClick={() => setSelectedMarker(null)}
                    style={{ background: 'none', border: 'none', color: '#65657a', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <StatMini icon={<Thermometer size={13} />} label="Temperature" value={`${selectedMarker.temperature || '--'}°C`} color="#F59E0B" />
                  <StatMini icon={<Activity size={13} />} label="AQI" value={selectedMarker.aqi || '--'} color={getAqiColor(selectedMarker.aqi || 0)} />
                  <StatMini icon={<Droplets size={13} />} label="Rainfall" value={selectedMarker.rainfall !== undefined ? `${selectedMarker.rainfall} mm` : '--'} color="#3B82F6" />
                  <StatMini icon={<AlertTriangle size={13} />} label="Risk" value={selectedMarker.risk_level || '--'} color={selectedMarker.risk_color || '#06D6A0'} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: `${getAqiColor(selectedMarker.aqi || 0)}20`,
                    color: getAqiColor(selectedMarker.aqi || 0),
                    borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
                    border: `1px solid ${getAqiColor(selectedMarker.aqi || 0)}40`,
                  }}>
                    <Wind size={11} />
                    {selectedMarker.aqi_label || getAqiCategory(selectedMarker.aqi)}
                  </span>
                </div>

                {selectedMarker.tourist_places?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a', marginBottom: '8px' }}>
                      Tourist Places
                    </div>
                    {selectedMarker.tourist_places.slice(0, 4).map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem', color: '#a0a0b0' }}>
                        <Navigation size={11} style={{ color: '#06D6A0', flexShrink: 0 }} />
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ textAlign: 'center', padding: '28px 16px', flexShrink: 0 }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
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
          <motion.div {...anim} transition={{ delay: 0.2 }} className="glass-card" style={{ flex: 1, padding: '14px', overflow: 'auto', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#65657a' }}>
                Cities ({filteredMarkers.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredMarkers.map((m) => {
                const isSelected = selectedMarker?.city === m.city;
                return (
                  <button
                    key={m.city}
                    onClick={() => handleCityListClick(m)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: isSelected ? 'rgba(6,214,160,0.08)' : 'transparent',
                      color: 'var(--text-primary)', fontSize: '0.85rem',
                      transition: 'background 0.15s',
                      outline: isSelected ? '1px solid rgba(6,214,160,0.2)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.risk_color || '#06D6A0', boxShadow: `0 0 5px ${m.risk_color || '#06D6A0'}` }} />
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{m.city}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>{m.temperature}°</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: getAqiColor(m.aqi || 0) }}>
                        AQI {m.aqi || '--'}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredMarkers.length === 0 && (
                <div style={{ textAlign: 'center', color: '#65657a', fontSize: '0.85rem', padding: '20px' }}>
                  No cities match your filters
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Internal CSS for Leaflet overrides */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Leaflet tile color inversion for dark mode aesthetics */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        
        .leaflet-container {
          background: #0f0f17 !important;
          font-family: var(--font-body);
        }
        
        /* Custom Leaflet Popup */
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        
        /* Custom Leaflet Icons */
        .custom-leaflet-icon {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '10px', padding: '10px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color, marginBottom: '4px' }}>
        {icon}
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#65657a' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}
