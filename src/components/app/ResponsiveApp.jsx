import React, { useState, useEffect } from 'react';
import TabContainer from './TabContainer';
import HomePage from '../home/HomePage';
import PageWrapper from './PageWrapper';

// Desktop wraps HomePage in the shared PageWrapper chrome (sidebar + header +
// mobile bottom nav) so navigating between Home / Map / Discover / Bolt feels
// continuous — same chrome, only the main content changes.
//
// Mobile keeps the existing TabContainer (tab-state navigation, no route
// change) so the mobile experience stays unchanged.
const ResponsiveApp = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return <TabContainer />;

  return (
    <PageWrapper activeNav="/">
      <HomePage embedded />
    </PageWrapper>
  );
};

export default ResponsiveApp;
