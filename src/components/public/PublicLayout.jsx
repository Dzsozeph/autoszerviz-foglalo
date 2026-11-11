import { Outlet } from 'react-router-dom';
import CegAdatProvider from '@/components/CegAdatProvider';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ChatWidget from './ChatWidget';
import MobileCallBar from './MobileCallBar';

export default function PublicLayout() {
  return (
    <CegAdatProvider>
      <div className="flex min-h-screen flex-col bg-brand-cream pb-[72px] lg:pb-0">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <ChatWidget />
        <MobileCallBar />
      </div>
    </CegAdatProvider>
  );
}