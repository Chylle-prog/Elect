import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar';
import './App.css';
import './css/PawBackground.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        {/* Paw background — fixed, z-index: 0, visible behind all page content */}
        <div className="paw-background">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="paw-print">🐾</span>
          ))}
        </div>
        <Navbar />
        {/* page-wrapper sits at z-index: 1 — above paws, below navbar */}
        <div className="page-wrapper">
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
