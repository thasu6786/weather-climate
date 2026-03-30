import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, MapPin, Loader2, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/visualization', label: 'Analytics' },
  { path: '/map', label: 'Map View' },
  { path: '/travel', label: 'Planner' },
  { path: '/expenses', label: 'Expenses' },
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Varanasi',
  'Shimla', 'Goa', 'Udaipur', 'Darjeeling', 'Manali', 'Agra', 'Rishikesh', 'Mysore'
];

export default function Header() {
  const { setSelectedCity, setLocationWeather } = useApp();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (value) => {
    setQuery(value);
    if (value.length > 0) {
      const filtered = CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectCity = (city) => {
    setSelectedCity(city);
    setQuery('');
    setSuggestions([]);
    navigate('/dashboard');
  };

  return (
    <header className="top-navbar">
      {/* Left: Logo */}
      <div className="navbar-brand" onClick={() => navigate('/')}>
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
            end={item.path === '/'}
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Search + Icons */}
      <div className="navbar-actions">
        {/* Search */}
        <div className="navbar-search" style={{ position: 'relative' }}>
          <Search size={15} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) selectCity(suggestions[0]);
            }}
            className="navbar-search-input"
            id="city-search"
            aria-label="Search cities"
          />
          {suggestions.length > 0 && (
            <div className="navbar-suggestions">
              {suggestions.map(city => (
                <button
                  key={city}
                  onClick={() => selectCity(city)}
                  className="navbar-suggestion-item"
                >
                  <MapPin size={13} />
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
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
