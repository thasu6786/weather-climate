import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart3, FlaskConical, Map, Compass, Plane, Wallet, Settings, ChevronLeft, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { section: 'Overview', items: [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Climate Dashboard', icon: BarChart3 },
  ]},
  { section: 'Analysis', items: [
    { path: '/visualization', label: 'Visualization Lab', icon: FlaskConical },
    { path: '/map', label: 'Map View', icon: Map },
  ]},
  { section: 'Planning', items: [
    { path: '/city', label: 'City Explorer', icon: Compass },
    { path: '/travel', label: 'Travel Planner', icon: Plane },
  ]},
  { section: 'Finance', items: [
    { path: '/expenses', label: 'Expense Manager', icon: Wallet },
  ]},
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();

  return (
    <aside className="sidebar" style={{ width: sidebarOpen ? undefined : 'var(--sidebar-collapsed)' }}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Globe size={20} color="#131318" />
        </div>
        {sidebarOpen && (
          <div>
            <h2>ClimateIQ</h2>
            <span>Urban Intelligence</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            {sidebarOpen && <div className="nav-section-label">{section.section}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
                title={item.label}
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border)' }}>
        <button
          className="nav-item"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ width: '100%', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
        >
          <ChevronLeft size={20} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
