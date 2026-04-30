import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './routeGuards';

// Import all pages
import Login from '../pages/Login';
import Home from '../pages/Home';
import Booking from '../pages/Booking';
import Profile from '../pages/Profile';
import Reviews from '../pages/Reviews';
import Contacts from '../pages/Contacts';
import About from '../pages/About';
import Register from '../pages/Register';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route - redirect to home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/reviews" element={<Reviews />} />

      {/* Protected routes (require authentication) */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;
