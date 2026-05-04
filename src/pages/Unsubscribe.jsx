import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState(token ? 'loading' : 'no_token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const data = await res.json();
        if (cancelled) return;
        setState(data.found ? 'success' : 'not_found');
      } catch (e) {
        if (cancelled) return;
        setError(e.message || String(e));
        setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const wrap = (children) => (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: 480,
        background: 'white',
        borderRadius: 12,
        padding: '32px 28px',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        {children}
      </div>
    </div>
  );

  if (state === 'loading') {
    return wrap(<p style={{ color: '#6b7280' }}>Updating your preferences…</p>);
  }
  if (state === 'no_token') {
    return wrap(
      <>
        <h1 style={{ fontSize: 22, marginTop: 0 }}>No unsubscribe link</h1>
        <p style={{ color: '#6b7280' }}>This page needs a token to identify you. Use the link from a recent Cravvr email.</p>
      </>
    );
  }
  if (state === 'success') {
    return wrap(
      <>
        <h1 style={{ fontSize: 22, marginTop: 0 }}>You're unsubscribed</h1>
        <p style={{ color: '#374151' }}>
          You won't receive any more marketing emails from Cravvr. Order receipts and account
          notifications will keep working.
        </p>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 24 }}>
          Changed your mind? Reach out at <a href="mailto:hi@cravvr.com">hi@cravvr.com</a>.
        </p>
      </>
    );
  }
  if (state === 'not_found') {
    return wrap(
      <>
        <h1 style={{ fontSize: 22, marginTop: 0 }}>Already unsubscribed</h1>
        <p style={{ color: '#6b7280' }}>Looks like this link has already been used or is no longer valid.</p>
      </>
    );
  }
  return wrap(
    <>
      <h1 style={{ fontSize: 22, marginTop: 0, color: '#dc2626' }}>Something went wrong</h1>
      <p style={{ color: '#6b7280' }}>{error || 'Please try again later.'}</p>
    </>
  );
};

export default Unsubscribe;
