import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Globe, Home, LayoutDashboard, BarChart3, Map, Plane, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/overview', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/visualization', label: 'Analytics', icon: BarChart3 },
  { path: '/map', label: 'Map View', icon: Map },
  { path: '/travel', label: 'Planner', icon: Plane },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
];

export default function Header() {
  const { setSelectedCity } = useApp();
  const navigate = useNavigate();

  return (
    <header className="top-navbar">
      {/* Left: Logo */}
      <div className="navbar-brand" onClick={() => navigate('/overview')}>
        <div className="navbar-logo-icon">
          <Globe size={18} strokeWidth={2.5} />
        </div>
        <span className="navbar-logo-text">CLIMATEIQ</span>
      </div>

      {/* Center: Navigation Links */}
      <nav className="navbar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/overview'}
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon-mobile" size={22} />
            <span className="nav-label-desktop">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Right: Search + Icons */}
      <div className="navbar-actions">
        <button className="navbar-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="navbar-notification-dot" />
        </button>

        {/* User Avatar */}
        <button className="navbar-icon-btn navbar-avatar" aria-label="Profile">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
