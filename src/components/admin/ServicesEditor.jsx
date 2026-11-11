import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ICON_OPTIONS } from '@/lib/serviceIcons';

const EMPTY = { name: '', short_description: '', icon: 'repair', order: 1, active: true };

export default function ServicesEditor() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const page = await base44.entities.Szolgaltatas.list({ sort: 'order', limit: 100 });
    setItems(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing('new');
    setForm({ ...EMPTY, order: items.length + 1 });
    setError('');
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name || '',
      short_description: item.short_description || '',
      icon: item.icon || 'repair',
      order: item.order ?? 1,
      active: item.active !== false,
    });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('A név megadása kötelező.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      short_description: form.short_description.trim(),
      icon: form.icon,
      order: Number(form.order) || 1,
      active: form.active,
    };
    try {
      if (editing === 'new') await base44.entities.Szolgaltatas.create(payload);
      else await base44.entities.Szolgaltatas.update(editing, payload);
      await load();
      setEditing(null);
    } catch (err) {
      setError('A mentés nem sikerült. Próbálja újra.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Biztosan törli ezt a szolgáltatást: ${item.name}?`)) return;
    await base44.entities.Szolgaltatas.delete(item.id);
    setItems((rows) => rows.filter((row) => row.id !== item.id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-brand-engine">
          A nyilvános Szolgáltatások oldalon az aktív elemek jelennek meg, sorrend szerint.
        </p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-ember px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white"
        >
          <Plus className="h-4 w-4" /> Új szolgáltatás
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-brand-silver bg-white">
        {loading ? (
          <div className="flex items-center gap-2 px-6 py-10 text-brand-engine">
            <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
          </div>
        ) : (
          <ul className="divide-y divide-brand-silver">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-brand">
                    {item.name}
                    {item.active === false && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        inaktív
                      </span>
                    )}
                  </p>
                  <p className="mt-1 line-clamp-2 max-w-2xl text-[13px] text-brand-engine">
                    {item.short_description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-silver text-brand hover:border-brand"
                    aria-label={`${item.name} szerkesztése`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-silver text-red-600 hover:border-red-300"
                    aria-label={`${item.name} törlése`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[19px] text-brand">
              {editing === 'new' ? 'Új szolgáltatás' : 'Szolgáltatás szerkesztése'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-brand-engine">
              A módosítás azonnal megjelenik a nyilvános oldalon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="svc-name">Név</Label>
              <Input
                id="svc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="svc-desc">Rövid leírás</Label>
              <Textarea
                id="svc-desc"
                rows={3}
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="svc-icon">Ikon</Label>
                <select
                  id="svc-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-[14px] text-brand"
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="svc-order">Sorrend</Label>
                <Input
                  id="svc-order"
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 text-[14px] text-brand">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-[#F97316]"
              />
              Aktív (megjelenik a nyilvános oldalon)
            </label>
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-[44px] rounded-full border border-brand-silver px-5 text-[12px] font-semibold uppercase tracking-[0.1em] text-brand-engine"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="min-h-[44px] rounded-full bg-brand px-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-60"
              >
                {saving ? 'Mentés…' : 'Mentés'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}