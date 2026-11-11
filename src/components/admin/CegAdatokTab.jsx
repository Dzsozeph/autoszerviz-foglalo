import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CEGADAT, pickCegAdat } from '@/lib/cegadat';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  { key: 'name', label: 'Cégnév', placeholder: 'Profi Autószerviz', className: 'sm:col-span-2' },
  { key: 'city', label: 'Város', placeholder: 'Budapest' },
  { key: 'address', label: 'Cím', placeholder: '1117 Budapest, Minta utca 12.' },
  { key: 'phone', label: 'Telefonszám', placeholder: '+36 1 234 5678' },
  { key: 'email', label: 'E-mail-cím', placeholder: 'info@profiautoszerviz.hu' },
  { key: 'whatsapp', label: 'WhatsApp-szám', placeholder: '+36 1 234 5678' },
  { key: 'hours_weekdays', label: 'Nyitvatartás hétköznap', placeholder: '8:00 – 17:00' },
  { key: 'hours_saturday', label: 'Nyitvatartás szombat', placeholder: '8:00 – 12:00' },
  { key: 'hours_sunday', label: 'Nyitvatartás vasárnap', placeholder: 'zárva' },
  {
    key: 'map_query',
    label: 'Térkép keresőszöveg (opcionális)',
    placeholder: '1117 Budapest, Minta utca 12.',
    className: 'sm:col-span-2',
  },
];

export default function CegAdatokTab() {
  const [form, setForm] = useState(DEFAULT_CEGADAT);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.CegAdat.list({ sort: '-updated_date', limit: 1 })
      .then((page) => {
        if (!active) return;
        const record = (page?.items || [])[0];
        if (record) {
          setRecordId(record.id);
          setForm(pickCegAdat(record));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'A cégnév kitöltése kötelező.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload = { ...form, name: form.name.trim() };
    try {
      if (recordId) {
        await base44.entities.CegAdat.update(recordId, payload);
      } else {
        const created = await base44.entities.CegAdat.create(payload);
        if (created?.id) setRecordId(created.id);
      }
      setMessage({
        type: 'success',
        text: 'Cégadatok mentve. A weboldal, az e-mailek, a strukturált adat és a chatbot ezeket használja.',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'A mentés nem sikerült. Próbálja újra.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-12 text-[15px] text-brand-engine">
        <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
      </div>
    );
  }

  return (
    <form
      onSubmit={save}
      className="rounded-xl border border-brand-silver bg-white p-6 sm:p-8"
      noValidate
    >
      <h2 className="font-heading text-[18px] font-semibold text-brand">Központi cégadatok</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-brand-engine">
        Ezek az adatok jelennek meg a weboldalon, az értesítő e-mailek láblécében, a strukturált
        adatokban (Google) és a chatbot válaszaiban. A mentés után a nyilvános oldalak
        újratöltéskor frissülnek.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.className || ''}>
            <Label htmlFor={`ceg-${field.key}`}>{field.label}</Label>
            <Input
              id={`ceg-${field.key}`}
              value={form[field.key] || ''}
              onChange={(event) => setField(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="mt-2 h-11"
            />
          </div>
        ))}
      </div>

      {message && (
        <p
          className={`mt-6 rounded-lg p-3 text-[13px] ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Mentés…' : 'Cégadatok mentése'}
      </button>
    </form>
  );
}