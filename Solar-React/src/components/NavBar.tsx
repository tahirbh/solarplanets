import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className={`nav-bar ${isMobile ? 'bottom' : ''}`}>
      <Link to="/" className="nav-link" data-active={location.pathname === '/'}>
        Home
      </Link>
      <Link to="/seasonal" className="nav-link" data-active={location.pathname === '/seasonal'}>
        Seasons
      </Link>
      <Link to="/sun-position" className="nav-link" data-active={location.pathname === '/sun-position'}>
        Sun Position
      </Link>
      <Link to="/gravity" className="nav-link" data-active={location.pathname === '/gravity'}>
        Gravity
      </Link>
    </nav>
  );
};

export default NavBar;