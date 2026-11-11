import AdminGate from '@/components/admin/AdminGate';
import AdminShell from '@/components/admin/AdminShell';
import usePageMeta from '@/lib/usePageMeta';

export default function Admin() {
  usePageMeta({
    title: 'Admin felület – Profi Autószerviz',
    description: 'A Profi Autószerviz admin felülete. Az oldal nem indexelhető.',
    path: '/admin',
    noindex: true,
  });

  return (
    <AdminGate>
      <AdminShell />
    </AdminGate>
  );
}