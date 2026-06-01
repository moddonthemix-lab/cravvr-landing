import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from '../home/HomePage';
import PageWrapper from './PageWrapper';
import { useAuth } from '../auth/AuthContext';

// PageWrapper owns the full chrome on every viewport:
//   desktop → collapsible shadcn Sidebar + SidebarInset header
//   mobile  → Sheet-based sidebar (via SidebarTrigger) + bottom nav
const ResponsiveApp = () => {
  const navigate = useNavigate();
  const { isOwner, loading } = useAuth();

  // First time a signed-in truck owner hits "/" in a session, bounce them to
  // their dashboard so the onboarding wizard can prompt them.
  useEffect(() => {
    if (loading || !isOwner) return;
    if (sessionStorage.getItem('cravvr.owner-bounced') === '1') return;
    sessionStorage.setItem('cravvr.owner-bounced', '1');
    navigate('/owner', { replace: true });
  }, [loading, isOwner, navigate]);

  return (
    <PageWrapper activeNav="/">
      <HomePage embedded />
    </PageWrapper>
  );
};

export default ResponsiveApp;
