import { useEffect, useState } from 'react';
import { Loader2, Inbox, Mail, Check, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDateTimeHu } from '@/lib/booking';

export default function MessagesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const page = await base44.entities.KapcsolatiUzenet.list({
      sort: '-created_date',
      limit: 100,
    });
    setItems(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (item) => {
    const next = !item.read;
    setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, read: next } : row)));
    try {
      await base44.entities.KapcsolatiUzenet.update(item.id, { read: next });
    } catch (err) {
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, read: item.read } : row)));
    }
  };

  const remove = async (item) => {
    if (!window.confirm('Biztosan törli ezt az üzenetet?')) return;
    await base44.entities.KapcsolatiUzenet.delete(item.id);
    setItems((rows) => rows.filter((row) => row.id !== item.id));
  };

  const unread = items.filter((item) => !item.read).length;

  return (
    <div>
      <p className="text-[14px] text-brand-engine">
        {items.length} üzenet · {unread} olvasatlan
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-brand-silver bg-white">
        {loading ? (
          <div className="flex items-center gap-2 px-6 py-10 text-brand-engine">
            <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Inbox className="mx-auto h-8 w-8 text-brand-silver" />
            <p className="mt-3 text-[15px] text-brand-engine">Még nem érkezett kapcsolati üzenet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-brand-silver">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-brand">
                      {item.name}
                      {!item.read && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                          olvasatlan
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-brand-engine">
                      <a href={`mailto:${item.email}`} className="hover:text-brand-ember">
                        {item.email}
                      </a>{' '}
                      · {formatDateTimeHu(item.created_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRead(item)}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-brand-silver px-4 text-[12px] font-semibold text-brand hover:border-brand"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {item.read ? 'Olvasatlannak jelöl' : 'Olvasottnak jelöl'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-silver text-red-600 hover:border-red-300"
                      aria-label="Üzenet törlése"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-[14px] leading-[1.65] text-brand">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}