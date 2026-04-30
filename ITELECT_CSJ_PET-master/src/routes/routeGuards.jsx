import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from './routeConfig';

// Authentication utilities
export const isAuthenticated = () => {
  return !!localStorage.getItem('currentUser');
};

export const getUserRole = () => {
  return 'user'; // All registered users are 'user' role for now
};

export const getCurrentUser = () => {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return null;
  try {
    return JSON.parse(currentUser);
  } catch (error) {
    console.warn("Could not parse currentUser in routeGuard", error);
    localStorage.removeItem('currentUser');
    return null;
  }
};

export const login = (userData = {}) => {
  // This function is now mainly used for compatibility
  // Actual login is handled in Login component
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole', userData.role || 'user');
  localStorage.setItem('userName', userData.name || 'User');
  localStorage.setItem('userEmail', userData.email || '');
};

export const logout = () => {
  // Clear all authentication data
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
};

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return children;
};

// Public Route Component (redirect if already authenticated)
export const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return children;
};

// Role-based Route Component (for future role management)
export const RoleBasedRoute = ({ children, requiredRole = 'user' }) => {
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  const userRole = getUserRole();
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  return children;
};

// Route guard hook for programmatic navigation
export const useRouteGuard = () => {
  const checkAuth = () => isAuthenticated();
  const checkRole = (requiredRole) => {
    const userRole = getUserRole();
    return userRole === requiredRole || userRole === 'admin';
  };
  
  return {
    isAuthenticated: checkAuth(),
    userRole: getUserRole(),
    canAccess: (requiredRole) => checkRole(requiredRole),
    login,
    logout
  };
};
