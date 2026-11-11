import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLogin from './AdminLogin';
import AccessStatusScreen from './AccessStatusScreen';

const AdminAccessContext = createContext({ isOwner: false, isAdmin: false, status: 'none' });

export const useAdminAccess = () => useContext(AdminAccessContext);

export default function AdminGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState({ signedIn: false, status: 'signed_out' });

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('adminSession', {});
      const data = response.data || {};
      setSession({
        signedIn: !!data.signedIn,
        isAdmin: !!data.isAdmin,
        isOwner: !!data.isOwner,
        status: data.status || (data.signedIn ? 'none' : 'signed_out'),
        name: data.name || '',
        email: data.email || '',
      });
    } catch (error) {
      setSession({ signedIn: false, isAdmin: false, isOwner: false, status: 'signed_out' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-silver border-t-brand" />
      </div>
    );
  }

  if (!session.signedIn) return <AdminLogin />;

  if (session.isAdmin) {
    return <AdminAccessContext.Provider value={session}>{children}</AdminAccessContext.Provider>;
  }

  return (
    <AccessStatusScreen
      status={session.status}
      name={session.name}
      email={session.email}
      onRefresh={load}
    />
  );
}