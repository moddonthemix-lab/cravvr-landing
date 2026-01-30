import React, { useState, useEffect } from 'react';
import TabContainer from './TabContainer';
import HomePage from '../home/HomePage';

// Responsive wrapper that shows TabContainer on mobile, HomePage on desktop
const ResponsiveApp = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: Show TabContainer with bottom nav
  // Desktop: Show HomePage with sidebar
  return isMobile ? <TabContainer /> : <HomePage />;
};

export default ResponsiveApp;
