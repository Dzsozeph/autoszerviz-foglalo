import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AdminGate({ children }) {
  const [state, setState] = useState({ loading: true, signedIn: false, admin: false });
  const location = useLocation();

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((me) => {
        if (active) setState({ loading: false, signedIn: true, admin: me?.role === 'admin' });
      })
      .catch(() => {
        if (active) setState({ loading: false, signedIn: false, admin: false });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-silver border-t-brand" />
      </div>
    );
  }

  if (!state.signedIn) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (!state.admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}