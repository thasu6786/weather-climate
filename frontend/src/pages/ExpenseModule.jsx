import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  Wallet, Users, Home, Plus, ArrowRight, AlertTriangle, TrendingUp,
  TrendingDown, DollarSign, CreditCard, ShoppingBag, Utensils, Car,
  Zap, Heart, BookOpen, Wifi, Gamepad2, Award, ArrowUpRight, ArrowDownRight,
  CheckCircle, Info, UserPlus, Send, PiggyBank, Target, BarChart3, X, BrainCircuit,
  QrCode, Calendar, Filter, Clock, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import SmartCard from '../components/ui/SmartCard';

const COLORS = ['#06D6A0', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#14B8A6', '#F97316'];
const TOOLTIP_STYLE = { background: '#252530', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#FFFFFF' };

const MODE_CONFIG = {
  solo: { label: 'Solo', icon: Wallet, color: '#06D6A0', desc: 'Personal finance tracker' },
  friends: { label: 'Friends', icon: Users, color: '#3B82F6', desc: 'Split & settle expenses' },
  family: { label: 'Family', icon: Home, color: '#A855F7', desc: 'Shared budget planner' },
};

const CATEGORY_ICONS = {
  Food: Utensils, Groceries: Utensils, Dining: Utensils,
  Transport: Car, Travel: Car, Shopping: ShoppingBag,
  Entertainment: Gamepad2, Movies: Gamepad2, Adventure: Gamepad2,
  Utilities: Zap, Health: Heart, Medical: Heart,
  Education: BookOpen, Subscriptions: Wifi, Rent: Home,
  Kids: Heart, Drinks: Utensils, Tickets: Award,
  General: CreditCard, Other: CreditCard,
};

const getCategoryIcon = (cat) => CATEGORY_ICONS[cat] || CreditCard;

export default function ExpenseModule() {
  const [mode, setMode] = useState('solo');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  
  // Phase 7 AI State
  const [optimization, setOptimization] = useState(null);

  // Form state
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food', paid_by: 'You', split_among: [] });

  // New Feature States
  const [showQR, setShowQR] = useState(null); // { amount, to }
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('all'); // all, week, month

  const fetchData = useCallback(async () => {
    setLoading(true);
    setOptimization(null);
    try {
      const res = await api.getExpenses(mode);
      setData(res);
      
      // Fetch Phase 7 Expense Optimization
      const opt = await api.getExpenseOptimization(mode);
      setOptimization(opt);
    } catch { 
      setData(null); 
    }
    setLoading(false);
  }, [mode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Smart mode suggestion
  useEffect(() => {
    fetch('/api/suggest-mode').then(r => r.json()).then(j => {
      if (j.data?.suggestion) setSuggestion(j.data.suggestion);
    }).catch(() => {});
  }, []);

  const addExpense = async () => {
    if (!form.description || !form.amount) return;
    const body = { ...form, amount: parseFloat(form.amount), mode,
      split_among: mode === 'solo' ? ['You'] : form.split_among.length > 0 ? form.split_among : ['You'] };
    await api.addExpense(body);
    setForm({ description: '', amount: '', category: 'Food', paid_by: 'You', split_among: [] });
    setShowAddForm(false);
    fetchData();
  };

  const cfg = MODE_CONFIG[mode];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${cfg.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <cfg.icon size={22} color={cfg.color} />
            </div>
            Expense Manager
          </h1>
          <p>{cfg.desc}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Smart Suggestion Banner */}
      <AnimatePresence>
        {suggestion && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: '#252530', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px',
              padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={18} color="#F59E0B" />
            <span style={{ flex: 1, fontSize: '0.9rem', color: '#A0A0B0' }}>{suggestion}</span>
            <button className="btn-ghost btn" onClick={() => setSuggestion(null)} style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#1C1C24', borderRadius: '14px', padding: '4px', marginBottom: '28px' }}>
        {Object.entries(MODE_CONFIG).map(([key, val]) => {
          const Icon = val.icon;
          const active = mode === key;
          return (
            <button key={key} onClick={() => setMode(key)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 16px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                background: active ? val.color : 'transparent',
                color: active ? '#131318' : '#A0A0B0', fontWeight: active ? 700 : 500,
                fontSize: '0.9rem', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}>
              <Icon size={18} /> {val.label}
            </button>
          );
        })}
      </div>

      {/* Phase 7: AI Expense Optimizer */}
      {optimization && optimization.insights?.length > 0 && optimization.status !== 'empty' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BrainCircuit size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Smart Expense Optimizer</h3>
          </div>
          <div className="grid-2">
            {optimization.insights.map((ins, idx) => (
              <SmartCard 
                key={idx}
                type={ins.type === 'warning' ? 'warning' : 'insight'}
                title={ins.type === 'warning' ? 'Spending Anomaly Detected' : 'Cost Saving Opportunity'}
                subtitle={`Based on ${cfg.label} mode analytics`}
                explanation={ins.message}
                icon={ins.type === 'warning' ? AlertTriangle : Target}
                score={optimization.potential_savings > 0 && idx === 0 ? `₹${optimization.potential_savings}` : null}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowAddForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#1C1C24', borderRadius: '20px', padding: '28px', width: '440px',
                border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ marginBottom: '20px' }}>Add {cfg.label} Expense</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder="Description" value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))} />
                <input placeholder="Amount (₹)" type="number" value={form.amount}
                  onChange={e => setForm(p => ({...p, amount: e.target.value}))} />
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}>
                  {(mode === 'solo' ? ['Food','Transport','Shopping','Entertainment','Utilities','Health','Education','Subscriptions'] :
                    mode === 'friends' ? ['Dining','Travel','Movies','Shopping','Drinks','Adventure','Tickets','Other'] :
                    ['Groceries','Rent','Kids','Shopping','Medical','Education','Utilities','Travel']).map(c =>
                    <option key={c} value={c}>{c}</option>
                  )}
                </select>
                {mode !== 'solo' && (
                  <input placeholder="Paid by" value={form.paid_by}
                    onChange={e => setForm(p => ({...p, paid_by: e.target.value}))} />
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={addExpense} style={{ flex: 1 }}>Add Expense</button>
                  <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Payment Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowQR(null)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#1C1C24', borderRadius: '24px', padding: '32px', width: '360px',
                border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <QrCode size={32} color="#A855F7" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>QR Payment</h3>
              <p style={{ color: '#A0A0B0', fontSize: '0.85rem', marginBottom: '24px' }}>Scan to pay {showQR.to}</p>
              <div style={{ width: '200px', height: '200px', margin: '0 auto 20px', background: '#252530',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed rgba(168,85,247,0.3)' }}>
                <div style={{ textAlign: 'center' }}>
                  <QrCode size={80} color="#A855F7" strokeWidth={1} />
                  <div style={{ fontSize: '0.7rem', color: '#65657A', marginTop: '8px' }}>Simulated QR</div>
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#A855F7', marginBottom: '8px' }}>
                ₹{showQR.amount?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#65657A', marginBottom: '20px' }}>
                {showQR.from} → {showQR.to}
              </div>
              <button className="btn btn-primary" onClick={() => setShowQR(null)} style={{ width: '100%' }}>Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode-Specific Dashboard */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '20px' }} />)}
        </div>
      ) : data ? (
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            {mode === 'solo' && <SoloDashboard data={data} filterCategory={filterCategory} setFilterCategory={setFilterCategory} />}
            {mode === 'friends' && <FriendsDashboard data={data} onShowQR={setShowQR} />}
            {mode === 'family' && <FamilyDashboard data={data} />}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No data available. Try adding some expenses!</p>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   SOLO DASHBOARD — Personal Finance Tracker
   ═══════════════════════════════════════════ */
function SoloDashboard({ data }) {
  const budget = data.budget || 20000;
  const utilization = data.utilization || 0;
  const remaining = data.remaining || 0;
  const alertType = data.budget_alert || 'ok';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Budget Overview Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={DollarSign} label="Total Spent" value={`₹${data.total?.toLocaleString()}`}
          color="#EF4444" sub={`${data.count} expenses`} />
        <StatCard icon={Target} label="Budget" value={`₹${budget?.toLocaleString()}`}
          color="#3B82F6" sub={`${utilization}% used`} />
        <StatCard icon={PiggyBank} label="Remaining" value={`₹${remaining?.toLocaleString()}`}
          color={remaining > 0 ? '#06D6A0' : '#EF4444'} sub={alertType === 'ok' ? 'On track' : 'Warning'} />
        <StatCard icon={TrendingUp} label="This Week" value={`₹${data.this_week_total?.toLocaleString() || 0}`}
          color="#F59E0B"
          sub={data.week_change_pct > 0 ? `↑${data.week_change_pct}%` : `↓${Math.abs(data.week_change_pct || 0)}%`} />
      </div>

      {/* Budget Progress Bar */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600 }}>Monthly Budget</span>
          <span style={{ color: alertType === 'ok' ? '#06D6A0' : alertType === 'warning' ? '#F59E0B' : '#EF4444', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {utilization}%
          </span>
        </div>
        <div style={{ height: '8px', background: '#252530', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(utilization, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '4px',
              background: alertType === 'ok' ? 'linear-gradient(90deg, #06D6A0, #14B8A6)' :
                alertType === 'warning' ? 'linear-gradient(90deg, #F59E0B, #F97316)' : 'linear-gradient(90deg, #EF4444, #DC2626)' }} />
        </div>
      </div>

      {/* Insights */}
      {data.insights?.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {data.insights.map((ins, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px',
                background: ins.type === 'danger' ? 'rgba(239,68,68,0.08)' : ins.type === 'warning' ? 'rgba(245,158,11,0.08)' :
                  ins.type === 'good' ? 'rgba(6,214,160,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${ins.type === 'danger' ? 'rgba(239,68,68,0.15)' : ins.type === 'warning' ? 'rgba(245,158,11,0.15)' :
                  ins.type === 'good' ? 'rgba(6,214,160,0.15)' : 'rgba(59,130,246,0.15)'}` }}>
              {ins.type === 'danger' ? <AlertTriangle size={18} color="#EF4444" /> :
                ins.type === 'warning' ? <AlertTriangle size={18} color="#F59E0B" /> :
                ins.type === 'good' ? <CheckCircle size={18} color="#06D6A0" /> :
                <Info size={18} color="#3B82F6" />}
              <span style={{ fontSize: '0.85rem', color: '#A0A0B0' }}>{ins.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Category Breakdown Pie */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Category Breakdown</h4>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.categories} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  paddingAngle={3} dataKey="amount" nameKey="name">
                  {data.categories?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Trend */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Spending Trend</h4>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <AreaChart data={data.daily_trend}>
                <defs>
                  <linearGradient id="soloGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#65657A', fontSize: 11 }}
                  tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#65657A', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Area type="monotone" dataKey="amount" stroke="#06D6A0" fill="url(#soloGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card">
        <h4 style={{ marginBottom: '16px' }}>Recent Expenses</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.expenses?.slice(-8).reverse().map((e, i) => {
            const IconComp = getCategoryIcon(e.category);
            return (
              <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: '#252530', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${COLORS[i % COLORS.length]}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={16} color={COLORS[i % COLORS.length]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#65657A' }}>{e.category} • {e.date}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#EF4444' }}>
                  -₹{e.amount?.toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   FRIENDS DASHBOARD — Splitwise-style App
   ═══════════════════════════════════════════ */
function FriendsDashboard({ data, onShowQR }) {
  const settlements = data.settlements || [];
  const memberStats = data.member_stats || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Group Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={Users} label="Group Members" value={data.members?.length || 0}
          color="#3B82F6" sub="active members" />
        <StatCard icon={DollarSign} label="Total Group Spend" value={`₹${data.total_group_spend?.toLocaleString() || 0}`}
          color="#06D6A0" sub={`${data.count} expenses`} />
        <StatCard icon={CreditCard} label="Your Share" value={`₹${data.avg_per_person?.toLocaleString() || 0}`}
          color="#F59E0B" sub="avg per person" />
        <StatCard icon={Send} label="Settlements" value={data.settlement_count || 0}
          color="#A855F7" sub="needed to settle" />
      </div>

      {/* Balance Table + Settlement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Member Balances */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#3B82F6" /> Balance Sheet
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {memberStats.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  background: '#252530', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                  background: `${COLORS[i % COLORS.length]}20`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: COLORS[i % COLORS.length] }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#65657A' }}>
                    Paid ₹{m.paid?.toLocaleString()} • Owes ₹{m.owes?.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)',
                  fontWeight: 600, color: m.balance >= 0 ? '#06D6A0' : '#EF4444' }}>
                  {m.balance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  ₹{Math.abs(m.balance)?.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Settlement Suggestions */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="#A855F7" /> Smart Settlements
          </h4>
          {settlements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#65657A' }}>
              <CheckCircle size={40} color="#06D6A0" style={{ marginBottom: '12px' }} />
              <p>All settled! 🎉</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {settlements.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
                    background: 'rgba(168,85,247,0.06)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.12)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EF444420',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    fontSize: '0.8rem', color: '#EF4444' }}>{t.from?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.from}</span>
                    <span style={{ color: '#65657A', margin: '0 8px' }}>pays</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.to}</span>
                  </div>
                  <ArrowRight size={16} color="#A855F7" />
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#A855F7', fontSize: '1rem' }}>
                    ₹{t.amount?.toLocaleString()}
                  </div>
                  <button onClick={() => onShowQR({ from: t.from, to: t.to, amount: t.amount })}
                    style={{ marginLeft: '8px', padding: '6px 10px', borderRadius: '8px',
                      background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      color: '#A855F7', fontSize: '0.7rem', fontWeight: 600 }}>
                    <QrCode size={12} /> Pay
                  </button>
                </motion.div>
              ))}
              <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(6,214,160,0.06)',
                borderRadius: '10px', fontSize: '0.8rem', color: '#06D6A0', textAlign: 'center' }}>
                Only {settlements.length} transaction{settlements.length > 1 ? 's' : ''} needed to settle all debts!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown + Member Contribution Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Group Spending by Category</h4>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.categories} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  paddingAngle={3} dataKey="amount" nameKey="name">
                  {data.categories?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Who Paid What</h4>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={memberStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#65657A', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#A0A0B0', fontSize: 12 }} width={60} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Bar dataKey="paid" fill="#3B82F6" radius={[0, 6, 6, 0]} name="Paid" />
                <Bar dataKey="owes" fill="#EF4444" radius={[0, 6, 6, 0]} name="Owes" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Group Expenses */}
      <div className="glass-card">
        <h4 style={{ marginBottom: '16px' }}>Recent Group Expenses</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.expenses?.slice(-6).reverse().map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                background: '#252530', borderRadius: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px',
                background: `${COLORS[i % COLORS.length]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => { const IC = getCategoryIcon(e.category); return <IC size={16} color={COLORS[i % COLORS.length]} />; })()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.description}</div>
                <div style={{ fontSize: '0.75rem', color: '#65657A' }}>
                  Paid by <span style={{ color: '#3B82F6' }}>{e.paid_by}</span> {'\u2022'} Split {e.split_among?.length} ways
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{'\u20B9'}{e.amount?.toLocaleString()}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass-card">
        <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#06D6A0" /> Activity Timeline
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '8px', bottom: '8px', width: '2px',
            background: 'rgba(255,255,255,0.06)' }} />
          {data.expenses?.slice(-8).reverse().map((e, i) => {
            const timeAgo = Math.round((Date.now()/1000 - e.timestamp) / 3600);
            const timeLabel = timeAgo < 24 ? `${timeAgo}h ago` : `${Math.round(timeAgo/24)}d ago`;
            return (
              <motion.div key={`tl-${e.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 10px 10px 36px',
                  position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', width: '14px', height: '14px',
                  borderRadius: '50%', background: '#252530', border: `2px solid ${COLORS[i % COLORS.length]}`,
                  zIndex: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>{e.paid_by}</span>
                    <span style={{ color: '#65657A' }}> paid </span>
                    <span style={{ fontWeight: 600 }}>{'\u20B9'}{e.amount?.toLocaleString()}</span>
                    <span style={{ color: '#65657A' }}> for </span>
                    <span style={{ color: '#A0A0B0' }}>{e.description}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#65657A', marginTop: '2px' }}>
                    {e.category} {'\u2022'} Split {e.split_among?.length} ways {'\u2022'} {timeLabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   FAMILY DASHBOARD — Budget Planner
   ═══════════════════════════════════════════ */
function FamilyDashboard({ data }) {
  const budget = data.budget || 50000;
  const utilization = data.utilization || 0;
  const remaining = data.remaining || 0;
  const contributions = data.contributions || [];
  const alerts = data.alerts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Family Budget Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={Home} label="Family Budget" value={`₹${budget?.toLocaleString()}`}
          color="#A855F7" sub="monthly budget" />
        <StatCard icon={DollarSign} label="Total Spent" value={`₹${data.total?.toLocaleString()}`}
          color="#EF4444" sub={`${data.count} expenses`} />
        <StatCard icon={PiggyBank} label="Remaining" value={`₹${remaining?.toLocaleString()}`}
          color={remaining > 0 ? '#06D6A0' : '#EF4444'} sub={`${utilization}% used`} />
        <StatCard icon={Award} label="Top Contributor"
          value={data.top_contributor?.name || '-'}
          color="#F59E0B" sub={`₹${data.top_contributor?.amount?.toLocaleString() || 0}`} />
      </div>

      {/* Budget Progress + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Family Budget Progress</h4>
          <div style={{ height: '12px', background: '#252530', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(utilization, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: '6px',
                background: utilization < 70 ? 'linear-gradient(90deg, #A855F7, #EC4899)' :
                  utilization < 90 ? 'linear-gradient(90deg, #F59E0B, #F97316)' : 'linear-gradient(90deg, #EF4444, #DC2626)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#A0A0B0' }}>
            <span>₹0</span>
            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>₹{data.total?.toLocaleString()} / ₹{budget?.toLocaleString()}</span>
            <span>₹{budget?.toLocaleString()}</span>
          </div>

          {/* Contribution Bars */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Who's Contributing</h4>
            {contributions.map((c, i) => (
              <div key={c.name} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#A0A0B0' }}>{c.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    ₹{c.amount?.toLocaleString()} ({c.percentage}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: '#252530', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '3px', background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#F59E0B" /> Budget Alerts
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '12px', borderRadius: '10px', fontSize: '0.8rem',
                  background: a.type === 'danger' ? 'rgba(239,68,68,0.08)' : a.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(6,214,160,0.08)',
                  border: `1px solid ${a.type === 'danger' ? 'rgba(239,68,68,0.15)' : a.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(6,214,160,0.15)'}`,
                  color: '#A0A0B0' }}>
                {a.text}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts: Category + Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Family Spending by Category</h4>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer>
              <BarChart data={data.categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#65657A', fontSize: 11 }} />
                <YAxis tick={{ fill: '#65657A', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {data.categories?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Daily Spending Trend</h4>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer>
              <LineChart data={data.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#65657A', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#65657A', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `₹${v?.toLocaleString()}`} />
                <Line type="monotone" dataKey="amount" stroke="#A855F7" strokeWidth={2} dot={{ r: 3, fill: '#A855F7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Family Expenses */}
      <div className="glass-card">
        <h4 style={{ marginBottom: '16px' }}>Recent Family Expenses</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.expenses?.slice(-8).reverse().map((e, i) => {
            const IconComp = getCategoryIcon(e.category);
            return (
              <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: '#252530', borderRadius: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px',
                  background: `${COLORS[i % COLORS.length]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={16} color={COLORS[i % COLORS.length]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#65657A' }}>
                    by <span style={{ color: '#A855F7' }}>{e.paid_by}</span> • {e.category} • {e.date}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{e.amount?.toLocaleString()}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SHARED STAT CARD COMPONENT
   ═══════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#65657A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#65657A' }}>{sub}</div>}
    </motion.div>
  );
}
