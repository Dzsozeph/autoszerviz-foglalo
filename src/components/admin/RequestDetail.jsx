import { useEffect, useState } from 'react';
import { Loader2, Pencil, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import StatusSelect from './StatusSelect';
import { formatDateHu, formatDateTimeHu } from '@/lib/booking';

const Row = ({ label, value }) => (
  <div className="border-b border-brand-silver py-3 last:border-0">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-engine">
      {label}
    </p>
    <p className="mt-1 whitespace-pre-line text-[15px] text-brand">{value || '–'}</p>
  </div>
);

const EMPTY_DRAFT = {
  customer_name: '',
  phone: '',
  email: '',
  car_brand: '',
  car_model: '',
  license_plate: '',
  service: '',
  problem_description: '',
  preferred_date: '',
  preferred_time: '',
};

export default function RequestDetail({
  request,
  onClose,
  onStatusChange,
  onNoteSaved = (_note) => {},
  onRequestUpdated = (_updated) => {},
  services = [],
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerEmail: '',
    service: '',
    amount: '0',
    notes: '',
    invoiceNumber: '',
  });
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  useEffect(() => {
    setNote(request?.internal_note || '');
    setMessage('');
    setEditing(false);
    setDraft(request || EMPTY_DRAFT);
    setInvoiceForm({
      customerName: request?.customer_name || '',
      customerEmail: request?.email || '',
      service: request?.service || '',
      amount: String(request?.amount || 47500),
      notes: request?.problem_description || '',
      invoiceNumber: '',
    });
  }, [request?.id]);

  if (!request) return null;

  const saveNote = async () => {
    setSaving(true);
    setMessage('');
    try {
      await base44.entities.Idopontkeres.update(request.id, { internal_note: note });
      onNoteSaved(note);
      setMessage('A megjegyzés mentve.');
    } catch (error) {
      setMessage('A mentés nem sikerült. Próbálja újra.');
    } finally {
      setSaving(false);
    }
  };

  const saveRequest = async (event) => {
    event.preventDefault();
    if (saving) return;
    const scheduleChanged =
      draft.preferred_date !== request.preferred_date ||
      draft.preferred_time !== request.preferred_time;
    if (
      scheduleChanged &&
      !window.confirm('Biztosan módosítja az időpontot? Az ügyfél értesítést kap a változásról.')
    ) return;

    setSaving(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('updateCalendarRequest', {
        id: request.id,
        updates: {
          customer_name: draft.customer_name,
          phone: draft.phone,
          email: draft.email,
          car_brand: draft.car_brand,
          car_model: draft.car_model,
          license_plate: draft.license_plate,
          service: draft.service,
          problem_description: draft.problem_description,
          preferred_date: draft.preferred_date,
          preferred_time: draft.preferred_time,
        },
      });
      const data = response.data || {};
      if (data.error) {
        const messages = {
          time_conflict: 'Erre az időpontra már van aktív foglalás.',
          outside_business_hours: 'A kiválasztott időpont a műhely nyitvatartásán kívül esik.',
          invalid_schedule: 'Válasszon érvényes dátumot és 30 perces időpontot.',
        };
        throw new Error(messages[data.error] || 'A módosítás nem sikerült. Próbálja újra.');
      }
      onRequestUpdated?.(data.request);
      setDraft(data.request);
      setEditing(false);
      setMessage(
        scheduleChanged
          ? data.emailSent
            ? 'A módosítás mentve, az ügyfél értesítő e-mailt kapott.'
            : data.emailSkipped
              ? 'A módosítás mentve, de nincs megadva ügyfél-e-mail-cím.'
              : 'A módosítás mentve, de az e-mail küldése nem sikerült.'
          : 'A foglalás módosításai mentve.'
      );
    } catch (error) {
      setMessage(error.message || 'A módosítás nem sikerült. Próbálja újra.');
    } finally {
      setSaving(false);
    }
  };

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const updateInvoiceField = (field, value) => {
    setInvoiceForm((current) => ({ ...current, [field]: value }));
  };

  const createInvoice = async () => {
    if (!invoiceForm.customerEmail || creatingInvoice) {
      setMessage('Az ügyfél e-mail címe kötelező a számla elküldéséhez.');
      return;
    }

    setCreatingInvoice(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('createInvoice', {
        bookingId: request.id,
        customerName: invoiceForm.customerName || request.customer_name,
        customerEmail: invoiceForm.customerEmail || request.email,
        service: invoiceForm.service || request.service,
        amount: Number(invoiceForm.amount) || 0,
        notes: invoiceForm.notes || request.problem_description || '',
        invoiceNumber: invoiceForm.invoiceNumber || undefined,
      });
      const data = response.data || {};
      if (data.error) {
        throw new Error(data.message || 'A számla kiállítása nem sikerült.');
      }

      if (data.emailStatus === 'failed' || data.emailSent === false) {
        setMessage(
          `A számla rögzítve, de az e-mail nem ment ki: ${data.emailError || 'ismeretlen küldési hiba'}. Javítsa a hibát, majd próbálja újra.`
        );
      } else if (data.emailStatus === 'already_sent') {
        setMessage(`Ez a számla már elküldésre került (${data.invoice?.invoice_number || 'TESZT'}).`);
      } else if (data.emailSent === true) {
        setMessage(`E-mail küldése sikeres (${data.invoice?.invoice_number || 'TESZT'}).`);
      } else {
        setMessage('A küldés eredménye nem ellenőrizhető. Ellenőrizze a számlák listáját, mielőtt újra próbálkozik.');
      }
    } catch (error) {
      setMessage(error.message || 'A számla kiállítása nem sikerült.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-[20px] text-brand">
            {request.customer_name} · {request.license_plate}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-brand-engine">
            Beérkezett: {formatDateTimeHu(request.created_date)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          {!editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft(request);
                setEditing(true);
                setMessage('');
              }}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-brand-silver px-4 text-[13px] font-semibold text-brand hover:border-brand/50"
            >
              <Pencil className="h-4 w-4" /> Foglalás szerkesztése
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(request);
                setEditing(false);
                setMessage('');
              }}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-brand-silver px-4 text-[13px] font-semibold text-brand hover:border-brand/50"
            >
              <X className="h-4 w-4" /> Mégse
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-[#F8FAFC] px-4 py-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-engine">
            Státusz
          </span>
          <StatusSelect
            value={request.status}
            onChange={(status) => onStatusChange(request.id, status)}
            disabled={false}
          />
        </div>

        <div className="mt-4 rounded-xl border border-brand-silver bg-[#F8FAFC] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-engine">
              Számla adatai
            </p>
            <button
              type="button"
              disabled={creatingInvoice || !invoiceForm.customerEmail}
              onClick={createInvoice}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-brand-ember px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingInvoice ? 'Számla kiállítása…' : 'Számla kiállítása'}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-brand-engine">
              Ügyfél neve
              <input
                value={invoiceForm.customerName}
                onChange={(event) => updateInvoiceField('customerName', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
              />
            </label>
            <label className="text-[13px] font-medium text-brand-engine">
              E-mail
              <input
                type="email"
                value={invoiceForm.customerEmail}
                onChange={(event) => updateInvoiceField('customerEmail', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
              />
            </label>
            <label className="text-[13px] font-medium text-brand-engine">
              Szolgáltatás
              <input
                value={invoiceForm.service}
                onChange={(event) => updateInvoiceField('service', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
              />
            </label>
            <label className="text-[13px] font-medium text-brand-engine">
              Összeg (Ft)
              <input
                type="number"
                min="0"
                value={invoiceForm.amount}
                onChange={(event) => updateInvoiceField('amount', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
              />
            </label>
            <label className="text-[13px] font-medium text-brand-engine sm:col-span-2">
              Számla megjegyzés / javítás leírása
              <textarea
                rows={3}
                value={invoiceForm.notes}
                onChange={(event) => updateInvoiceField('notes', event.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-silver bg-white p-3 text-[14px] text-brand"
              />
            </label>
          </div>
        </div>

        {editing ? (
          <form onSubmit={saveRequest} className="mt-2 grid gap-4 sm:grid-cols-2">
            {[
              ['customer_name', 'Ügyfél neve'],
              ['phone', 'Telefonszám'],
              ['email', 'E-mail-cím'],
              ['car_brand', 'Jármű márkája'],
              ['car_model', 'Jármű típusa'],
              ['license_plate', 'Rendszám'],
            ].map(([field, label]) => (
              <label key={field} className="text-[13px] font-medium text-brand-engine">
                {label}
                <input
                  value={draft[field] || ''}
                  onChange={(event) => setField(field, event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-brand-silver px-3 text-[14px] text-brand"
                  required={['customer_name', 'phone'].includes(field)}
                />
              </label>
            ))}
            <label className="text-[13px] font-medium text-brand-engine">
              Szolgáltatás
              <select
                value={draft.service || ''}
                onChange={(event) => setField('service', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
                required
              >
                {[...new Set([draft.service, ...services.map((service) => service.name)].filter(Boolean))]
                  .map((service) => <option key={service} value={service}>{service}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-medium text-brand-engine">
              Dátum
              <input
                type="date"
                value={draft.preferred_date || ''}
                onChange={(event) => setField('preferred_date', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver px-3 text-[14px] text-brand"
                required
              />
            </label>
            <label className="text-[13px] font-medium text-brand-engine">
              Időpont
              <select
                value={draft.preferred_time || ''}
                onChange={(event) => setField('preferred_time', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-brand-silver bg-white px-3 text-[14px] text-brand"
                required
              >
                {Array.from({ length: 19 }, (_, index) => {
                  const minutes = 8 * 60 + index * 30;
                  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
                }).map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-medium text-brand-engine sm:col-span-2">
              Hiba leírása
              <textarea
                value={draft.problem_description || ''}
                onChange={(event) => setField('problem_description', event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-brand-silver p-3 text-[14px] text-brand"
              />
            </label>
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <p role="status" className="text-[13px] text-brand-engine">{message}</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-brand px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Mentés…' : 'Módosítások mentése'}
              </button>
            </div>
          </form>
        ) : <div className="mt-2">
          <Row label="Telefonszám" value={request.phone} />
          <Row label="E-mail" value={request.email} />
          <Row label="Autó" value={`${request.car_brand || ''} ${request.car_model || ''}`.trim()} />
          <Row label="Rendszám" value={request.license_plate} />
          <Row label="Kért szolgáltatás" value={request.service} />
          <Row
            label="Preferált időpont"
            value={`${formatDateHu(request.preferred_date)} ${request.preferred_time || ''}`}
          />
          <Row label="Hiba leírása" value={request.problem_description} />
        </div>}

        {!editing && message && (
          <p role="status" className="text-[13px] text-brand-engine">{message}</p>
        )}

        <div className="mt-4 rounded-lg border border-brand-silver p-4">
          <label
            htmlFor="internal-note"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-engine"
          >
            Belső megjegyzés (csak admin látja)
          </label>
          <Textarea
            id="internal-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Pl. visszahívtam, jövő hét kedden hozza az autót."
            className="mt-2"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-brand-engine">{message}</p>
            <button
              type="button"
              onClick={saveNote}
              disabled={saving}
              className="inline-flex min-h-[40px] items-center rounded-full bg-brand px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              {saving ? 'Mentés…' : 'Megjegyzés mentése'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}