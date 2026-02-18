import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import SeasonalChange from './pages/SeasonalChange';
import SunPosition from './pages/SunPosition';
import Gravity from './pages/Gravity';

function App() {
  return (
    <BrowserRouter>
      <div className="galaxy-bg" />
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/seasonal" element={<SeasonalChange />} />
        <Route path="/sun-position" element={<SunPosition />} />
        <Route path="/gravity" element={<Gravity />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;