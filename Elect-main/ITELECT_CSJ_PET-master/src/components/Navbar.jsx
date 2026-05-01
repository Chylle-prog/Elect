import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../routes/routeGuards';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, [location]);

  // Navigation items: Home, Reviews, Contacts, About
  const navItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/contacts', label: 'Contacts', icon: '📞' },
    { path: '/about', label: 'About', icon: 'ℹ️' }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logout();
      setIsLoggedIn(false);
      navigate('/home');
    } else {
      navigate('/login');
    }
    setMobileMenuOpen(false);
  };

  // Hide navbar on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">🐾</span>
          <span className="logo-text">CSJ Pet Grooming Services</span>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => {
            // Skip protected items if not logged in
            if (item.protected && !isLoggedIn) return null;

            return (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="navbar-actions">
          {isLoggedIn && (
            <button
              className="profile-btn-nav"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              👤 Profile
            </button>
          )}
          <button className={`login-btn ${isLoggedIn ? 'logout' : ''}`} onClick={handleAuthAction}>
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
