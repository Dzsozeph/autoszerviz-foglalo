import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Wrench,
  HelpCircle,
  Mail,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAdminAccess } from './AdminGate';
import DashboardTab from './DashboardTab';
import RequestsTab from './RequestsTab';
import ServicesEditor from './ServicesEditor';
import FaqEditor from './FaqEditor';
import MessagesTab from './MessagesTab';
import AccessRequestsTab from './AccessRequestsTab';
import CegAdatokTab from './CegAdatokTab';

const BASE_TABS = [
  { key: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard },
  { key: 'requests', label: 'Időpontkérések', icon: CalendarClock },
  { key: 'services', label: 'Szolgáltatások', icon: Wrench },
  { key: 'faq', label: 'GYIK', icon: HelpCircle },
  { key: 'messages', label: 'Kapcsolati üzenetek', icon: Mail },
];

export default function AdminShell() {
  const access = useAdminAccess();
  const [tab, setTab] = useState('dashboard');

  const tabs = access.isOwner
    ? [
        ...BASE_TABS,
        { key: 'company', label: 'Cégadatok', icon: Building2 },
        { key: 'access', label: 'Hozzáférési kérelmek', icon: ShieldCheck },
      ]
    : BASE_TABS;

  const active = tabs.find((item) => item.key === tab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <header className="bg-brand text-white">
        <div className="container-page flex h-[68px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-brand-ember">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-[15px] font-semibold">Profi Autószerviz</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                Admin felület{access.isOwner ? ' · tulajdonos' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Oldal megtekintése</span>
            </Link>
            <button
              type="button"
              onClick={() => base44.auth.logout('/')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kilépés</span>
            </button>
          </div>
        </div>

        <nav aria-label="Admin navigáció" className="container-page overflow-x-auto">
          <div className="flex gap-1 pb-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-t-lg px-4 text-[13px] font-semibold transition-colors ${
                  tab === key
                    ? 'bg-[#F1F5F9] text-brand'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="container-page py-8">
        <h1 className="font-heading text-[24px] font-semibold tracking-tight text-brand">
          {active?.label}
        </h1>
        <div className="mt-6">
          {tab === 'dashboard' && (
            <DashboardTab onOpenRequests={() => setTab('requests')} onOpenAccess={() => setTab('access')} />
          )}
          {tab === 'requests' && <RequestsTab />}
          {tab === 'services' && <ServicesEditor />}
          {tab === 'faq' && <FaqEditor />}
          {tab === 'messages' && <MessagesTab />}
          {tab === 'company' && access.isOwner && <CegAdatokTab />}
          {tab === 'access' && access.isOwner && <AccessRequestsTab />}
        </div>
      </main>
    </div>
  );
}