import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Wallet, Navigation, Sparkles, AlertTriangle, ArrowRight,
  Sun, Wind, Camera, Activity, CheckCircle, ChevronLeft, Map, Coffee
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const anim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

export default function TravelPlanner() {
  const { selectedCity, setSelectedCity } = useApp();

  const [step, setStep] = useState('INPUT'); // INPUT, ANALYZING, COMPARE, ITINERARY
  const [formData, setFormData] = useState({
    city: selectedCity !== 'Your Location' ? selectedCity : 'Manali',
    days: 3,
    budget: 'Moderate',
    travelType: 'Relax'
  });

  const [proposals, setProposals] = useState(null);
  const [finalPlan, setFinalPlan] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!formData.city) return;
    setStep('ANALYZING');
    setError(null);
    try {
      const data = await api.getSmartPlanner({
        city: formData.city,
        days: formData.days,
        budget: formData.budget,
        travel_type: formData.travelType
      });
      setProposals(data);
      setStep('COMPARE');
    } catch (err) {
      console.error(err);
      setError("Failed to generate AI plans. Please try again.");
      setStep('INPUT');
    }
  };

  const selectPlan = (plan) => {
    setFinalPlan(plan);
    setStep('ITINERARY');
    // Optionally update global selected city to trace back to dash
    // setSelectedCity(plan.city);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#06D6A0';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <motion.div {...anim} className="page-header">
        <h1>Intelligent Travel Engine</h1>
        <p>AI-driven itineraries based on real-time climate, AQI, and global travel databases.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: INPUT FORM */}
        {step === 'INPUT' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ color: 'var(--accent-primary)' }} />
              Design Your Journey
            </h2>
            
            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Destination</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Duration (Days)</label>
                  <div className="tab-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {[2, 3, 5, 7].map(d => (
                      <button key={d} className={`tab-item ${formData.days === d ? 'active' : ''}`} onClick={() => setFormData({ ...formData, days: d })}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Budget Tier</label>
                  <div className="tab-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {['Budget', 'Moderate', 'Luxury'].map(b => (
                      <button key={b} className={`tab-item ${formData.budget === b ? 'active' : ''}`} onClick={() => setFormData({ ...formData, budget: b })}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Travel Style</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { id: 'Relax', icon: <Coffee size={18}/> },
                    { id: 'Adventure', icon: <Activity size={18}/> },
                    { id: 'Family', icon: <Camera size={18}/> }
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setFormData({ ...formData, travelType: t.id })}
                      style={{ 
                        padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        background: formData.travelType === t.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${formData.travelType === t.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`,
                        color: formData.travelType === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                      {t.icon}
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

              <button 
                onClick={handleGenerate}
                style={{
                  width: '100%', padding: '18px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#000',
                  fontWeight: 700, fontSize: '1.1rem', marginTop: 'var(--space-md)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}>
                Evaluate Logistics & Generate <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ANALYZING (LOADING) */}
        {step === 'ANALYZING' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center', padding: '40px' }}>
             <div className="spinner" style={{ margin: '0 auto 24px auto', width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
             <h2 style={{ marginBottom: '16px' }}>Synthesizing Intelligence...</h2>
             <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
               Fetching live thermal dynamics, parsing AQI hazards, and cross-referencing {formData.travelType} destinations via Google Places...
             </p>
             <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </motion.div>
        )}

        {/* STEP 3: COMPARE PLANS */}
        {step === 'COMPARE' && proposals && (
          <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Map size={24} style={{ color: 'var(--accent-primary)' }}/> Select Your Blueprint</h2>
              <button onClick={() => setStep('INPUT')} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronLeft size={16} /> Edit Constraints
              </button>
            </div>

            <div className="grid-2">
              {/* PLAN A */}
              <PlanCard 
                title="Your Request"
                badge="Baseline"
                plan={proposals.user_request_plan} 
                onSelect={() => selectPlan(proposals.user_request_plan)} 
                color={getScoreColor(proposals.user_request_plan.comfort_score)} 
              />
              
              {/* PLAN B */}
              <PlanCard 
                title="AI Alternative"
                badge="Smart Recommendation"
                plan={proposals.ai_alternative_plan} 
                onSelect={() => selectPlan(proposals.ai_alternative_plan)} 
                color={getScoreColor(proposals.ai_alternative_plan.comfort_score)} 
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: FINAL ITINERARY */}
        {step === 'ITINERARY' && finalPlan && (
          <motion.div key="itinerary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <div>
                <button onClick={() => setStep('COMPARE')} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <ChevronLeft size={16} /> Back to Comparisons
                </button>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{finalPlan.city} Itinerary</h1>
                <p style={{ color: 'var(--text-muted)' }}>{formData.days} Days • {formData.budget} Tier • {formData.travelType}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>AI Comfort Index</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(finalPlan.comfort_score) }}>{finalPlan.comfort_score}</div>
              </div>
            </div>

            {/* Explainable AI block */}
            <div className="glass-card" style={{ marginBottom: 'var(--space-xl)', borderLeft: `4px solid ${getScoreColor(finalPlan.comfort_score)}` }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--text-secondary)' }}/> AI Rationale
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {finalPlan.reasoning.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.5 }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid-2">
              {/* Timeline Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem' }}>
                  <Calendar size={20} style={{ color: 'var(--accent-primary)' }}/> Daily Logistics
                </h3>
                {finalPlan.itinerary.map((day) => (
                  <div key={day.day} className="glass-card">
                    <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px', color: '#fff' }}>
                      {day.title}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {day.activities.map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ width: '100px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                            {act.start_time} - {act.end_time}
                          </div>
                          <div style={{ width: '2px', background: act.type === 'sightseeing' ? 'var(--accent-primary)' : 'var(--border)', borderRadius: '2px' }} />
                          <div>
                            <div style={{ color: act.type === 'sightseeing' ? '#fff' : 'var(--text-secondary)', fontWeight: act.type === 'sightseeing' ? 500 : 400 }}>
                              {act.activity}
                            </div>
                            {act.place_rating && act.place_rating !== 'No rating' && (
                              <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ★ {act.place_rating} Google Rating
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Expenses & Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                {/* Visual places */}
                <div className="glass-card">
                   <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Sourced Attractions</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {finalPlan.top_places_metadata.slice(0, 4).map((p, i) => (
                       <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                         <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '4px' }}>{p.name}</div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                           <span>★ {p.rating} ({p.user_ratings_total})</span>
                           <span>{p.types?.[0]?.replace(/_/g, ' ')}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Expenses */}
                <div className="glass-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '24px' }}>
                    <Wallet size={18} style={{ color: 'var(--accent-primary)' }}/> Financial Estimates
                  </h3>
                  
                  <div style={{ height: '220px', width: '100%', marginBottom: '24px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Hotel', cost: finalPlan.cost.totals.stay },
                          { name: 'Food', cost: finalPlan.cost.totals.food },
                          { name: 'Travel', cost: finalPlan.cost.totals.local_transport + finalPlan.cost.totals.round_trip_transport },
                          { name: 'Activity', cost: finalPlan.cost.totals.activities }
                        ]}
                        layout="vertical"
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1A1A24', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(v) => `₹${v.toLocaleString()}`} />
                        <Bar dataKey="cost" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Grand Total</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#fff' }}>
                        ₹{finalPlan.cost.totals.grand_total.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>For {formData.days} days</div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponent for Plan Cards
function PlanCard({ title, badge, plan, onSelect, color }) {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: color }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
          <h3 style={{ fontSize: '1.8rem', margin: '4px 0', color: '#fff' }}>{plan.city}</h3>
          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', background: `${color}15`, color: color, fontSize: '0.75rem', fontWeight: 600 }}>
            {badge}
          </span>
        </div>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: `conic-gradient(${color} ${plan.comfort_score}%, var(--bg-elevated) 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>{plan.comfort_score}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <Sun size={14} /> Climate
          </div>
          <div style={{ fontWeight: 600 }}>{plan.weather.temp}°C, {plan.weather.condition}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <Wind size={14} /> Air Quality
          </div>
          <div style={{ fontWeight: 600 }}>{plan.aqi_label}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>AI Reasoning:</div>
        <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.5 }}>"{plan.reasoning[0]}"</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Cost</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
            ₹{plan.cost.totals.grand_total.toLocaleString()}
          </div>
        </div>
        <button 
          onClick={onSelect}
          style={{ padding: '10px 20px', borderRadius: '8px', background: color, color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', filter: 'brightness(1.1)' }}
        >
          Select Plan
        </button>
      </div>
    </div>
  );
}
