import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Calendar, Clock, MapPin, Star, DollarSign, Sparkles, ChevronRight, BrainCircuit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import SmartCard from '../components/ui/SmartCard';
import PlanComparison from '../components/ui/PlanComparison';

const anim = { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } };

export default function TravelPlanner() {
  const { selectedCity } = useApp();
  const [recommendations, setRecommendations] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  
  // Phase 7 AI State
  const [aiDecision, setAiDecision] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.getTravel()
      .then(async data => {
        const recs = data?.recommendations || [];
        setRecommendations(recs);
        
        // Run Phase 7 Decision Engine on top 3 recommendations
        if (recs.length > 0) {
          setAnalyzing(true);
          try {
            // Map simple recs to decision engine options
            const options = recs.slice(0, 3).map((r, i) => ({
              id: `plan_${i}`,
              name: r.city,
              city: r.city,
              cost: r.cost_level === 'Low' ? 3000 : r.cost_level === 'Medium' ? 6000 : 12000
            }));
            
            const decision = await api.getDecision(10000, options);
            setAiDecision(decision);
          } catch (e) {
            console.error("Failed to run decision engine:", e);
          } finally {
            setAnalyzing(false);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const generateItinerary = async (city) => {
    setGenLoading(true);
    setSelectedPlan(city);
    try {
      const data = await api.getItinerary(city, days);
      setItinerary(data);
    } catch (e) {
      console.error(e);
    }
    setGenLoading(false);
  };

  const getComfortColor = (score) => {
    if (score >= 80) return 'var(--accent-primary)';
    if (score >= 60) return 'var(--accent-secondary)';
    if (score >= 40) return 'var(--accent-warm)';
    return 'var(--accent-danger)';
  };

  return (
    <div>
      <motion.div {...anim} className="page-header">
        <h1>AI Travel Planner</h1>
        <p>Intelligent trip recommendations powered by multi-factor decision engine</p>
      </motion.div>

      {/* Days selector */}
      <motion.div {...anim} transition={{ delay: 0.05 }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Plan for:</span>
        <div className="tab-bar">
          {[1, 2, 3, 5, 7].map(d => (
            <button key={d} className={`tab-item ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
              {d} {d === 1 ? 'Day' : 'Days'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Phase 7: Intelligent Decision Support UI */}
      {analyzing && (
        <div className="glass-card animate-in" style={{ marginBottom: 'var(--space-xl)', textAlign: 'center', padding: 'var(--space-xl)' }}>
          <BrainCircuit size={32} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
          <h3>Decision Engine Running</h3>
          <p style={{ color: 'var(--text-muted)' }}>Evaluating weather, AQI, comfort, and risk factors across all alternatives...</p>
        </div>
      )}

      {aiDecision && !analyzing && (
        <motion.div {...anim} transition={{ delay: 0.1 }} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <BrainCircuit size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>AI Top Recommendation</h2>
          </div>
          
          <div className="grid-2">
            <div>
              <SmartCard 
                title={`#1 Choice: ${aiDecision.best_option?.name}`}
                subtitle="Calculated objectively against all user constraints"
                score={aiDecision.decision_score}
                explanation={aiDecision.explanation}
                actionText={`Build ${days}-Day Itinerary for ${aiDecision.best_option?.name}`}
                onAction={() => generateItinerary(aiDecision.best_option?.name)}
                icon={Star}
              />
            </div>
            <div>
              <PlanComparison 
                plans={[aiDecision.best_option, ...(aiDecision.ranked_alternatives || [])]} 
                winnerId={aiDecision.best_option?.id}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations Grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', marginTop: 'var(--space-2xl)' }}>
        <Plane size={20} style={{ color: 'var(--text-secondary)' }} />
        <h2 style={{ fontSize: '1.25rem' }}>Explore Alternatives</h2>
      </div>
      
      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: '280px' }} />)
        ) : (
          recommendations.map((rec, i) => (
            <motion.div key={rec.city} {...anim} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card"
              style={{ cursor: 'pointer', border: selectedPlan === rec.city ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => generateItinerary(rec.city)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '2px' }}>{rec.city}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.state}</div>
                </div>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: `conic-gradient(${getComfortColor(rec.comfort_score)} ${rec.comfort_score}%, var(--bg-elevated) 0)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {rec.comfort_score}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                {rec.highlights?.map((h, j) => (
                  <span key={j} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{h}</span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {rec.best_time}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> {rec.cost_level}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Generate Itinerary</span>
                <ChevronRight size={16} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Generated Itinerary */}
      {(genLoading || itinerary) && (
        <motion.div {...anim} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>AI-Generated Itinerary — {itinerary?.city || selectedPlan}</h2>
          </div>

          {genLoading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Generating your perfect itinerary...</div>
              <div style={{ color: 'var(--text-muted)' }}>Analyzing climate data, comfort scores, and local attractions</div>
            </div>
          ) : itinerary?.itinerary?.map((day, i) => (
            <motion.div key={i} {...anim} transition={{ delay: 0.15 + i * 0.05 }} className="glass-card" style={{ marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1120', fontWeight: 700, fontSize: '0.8rem' }}>
                  {day.day}
                </div>
                {day.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {day.activities?.map((act, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: act.type === 'sightseeing' ? 'rgba(6,214,160,0.05)' : 'transparent', borderLeft: `3px solid ${act.type === 'sightseeing' ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '100px' }}>
                      {act.start_time} - {act.end_time}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: act.type === 'sightseeing' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {act.activity}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {itinerary && !genLoading && (
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Total Budget</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                  ₹{itinerary.estimated_budget?.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {itinerary.days} days in {itinerary.city}, {itinerary.state}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
