import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TabContainer from './TabContainer';
import HomePage from '../home/HomePage';
import PageWrapper from './PageWrapper';
import { useAuth } from '../auth/AuthContext';

// Desktop wraps HomePage in the shared PageWrapper chrome (sidebar + header +
// mobile bottom nav) so navigating between Home / Map / Discover / Bolt feels
// continuous — same chrome, only the main content changes.
//
// Mobile keeps the existing TabContainer (tab-state navigation, no route
// change) so the mobile experience stays unchanged.
const ResponsiveApp = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const { isOwner, loading } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // First time a signed-in truck owner hits "/" in a session, bounce them to
  // their dashboard so the onboarding wizard can prompt them. After the
  // first bounce they can navigate back to "/" freely.
  useEffect(() => {
    if (loading || !isOwner) return;
    if (sessionStorage.getItem('cravvr.owner-bounced') === '1') return;
    sessionStorage.setItem('cravvr.owner-bounced', '1');
    navigate('/owner', { replace: true });
  }, [loading, isOwner, navigate]);

  if (isMobile) return <TabContainer />;

  return (
    <PageWrapper activeNav="/">
      <HomePage embedded />
    </PageWrapper>
  );
};

export default ResponsiveApp;
