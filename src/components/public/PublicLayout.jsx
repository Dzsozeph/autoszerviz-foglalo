import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ChatWidget from './ChatWidget';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}