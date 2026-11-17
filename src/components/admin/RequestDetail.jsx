import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import StatusSelect from './StatusSelect';
import { formatDateHu, formatDateTimeHu } from '@/lib/booking';
import { calculateInvoiceTotals, formatMoneyHu } from '@/lib/invoice';
import { createInvoicePdf } from '@/lib/invoicePdf';

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

function getDefaultInvoiceForm(request) {
  return {
    customerName: request?.customer_name || '',
    customerEmail: request?.email || '',
    notes: request?.problem_description || '',
    invoiceNumber: '',
    items: [{
      id: 'initial-item',
      name: request?.service || '',
      type: 'munkadij',
      quantity: '1',
      unit: 'alkalom',
      grossUnitPrice: String(request?.amount || 0),
      vatRate: '0.27',
    }],
  };
}

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
  const [invoiceForm, setInvoiceForm] = useState(() => getDefaultInvoiceForm(null));
  const [invoiceFeedback, setInvoiceFeedback] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  useEffect(() => {
    setNote(request?.internal_note || '');
    setMessage('');
    setInvoiceFeedback(null);
    setEditing(false);
    setDraft(request || EMPTY_DRAFT);
    setInvoiceForm(getDefaultInvoiceForm(request));
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
    setInvoiceFeedback(null);
  };

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    setInvoiceFeedback(null);
  };

  const showInvoiceFeedback = (type, text) => {
    setInvoiceFeedback({ type, text });
    toast({
      title: type === 'success' ? 'Számla e-mail elküldve' : 'Számlaküldési hiba',
      description: text,
    });
  };

  const createInvoice = async () => {
    if (!invoiceForm.customerEmail || creatingInvoice) {
      showInvoiceFeedback('error', 'Az ügyfél e-mail címe kötelező a számla elküldéséhez.');
      return;
    }

    const items = invoiceForm.items.map((item) => ({
      name: item.name.trim(),
      type: item.type,
      quantity: Number(item.quantity),
      unit: item.unit.trim() || 'db',
      grossUnitPrice: Number(item.grossUnitPrice),
      vatRate: Number(item.vatRate),
    }));
    if (
      items.length === 0 ||
      items.some((item) =>
        !item.name ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.grossUnitPrice) ||
        item.grossUnitPrice < 0 ||
        ![0, 0.05, 0.18, 0.27].includes(item.vatRate)
      )
    ) {
      showInvoiceFeedback('error', 'Ellenőrizze, hogy minden tétel neve, mennyisége, egységára és ÁFA-kulcsa meg van adva.');
      return;
    }

    const totals = calculateInvoiceTotals(items);
    if (totals.gross <= 0) {
      showInvoiceFeedback('error', 'A számla bruttó végösszegének nullánál nagyobbnak kell lennie.');
      return;
    }

    setCreatingInvoice(true);
    setInvoiceFeedback(null);
    try {
      const invoiceNumber = invoiceForm.invoiceNumber ||
        `TESZT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const issueDate = new Date();
      const { pdfBase64 } = await createInvoicePdf({
        invoiceNumber,
        issueDate,
        customerName: invoiceForm.customerName || request.customer_name,
        customerEmail: invoiceForm.customerEmail || request.email,
        customerPhone: request.phone,
        car: `${request.car_brand || ''} ${request.car_model || ''}`.trim(),
        licensePlate: request.license_plate,
        items,
        notes: invoiceForm.notes,
      });
      const response = await base44.functions.invoke('createInvoice', {
        bookingId: request.id,
        customerName: invoiceForm.customerName || request.customer_name,
        customerEmail: invoiceForm.customerEmail || request.email,
        service: items.map((item) => item.name).join(', '),
        amount: totals.gross,
        netAmount: totals.net,
        vatAmount: totals.vat,
        items,
        notes: invoiceForm.notes,
        invoiceNumber,
        pdfBase64,
      });
      const data = response.data || {};
      if (data.error) {
        throw new Error(data.message || data.error || 'A számla kiállítása nem sikerült.');
      }
      if (data.invoice?.invoice_number) {
        setInvoiceForm((current) => ({ ...current, invoiceNumber: data.invoice.invoice_number }));
      }

      if (data.emailStatus === 'failed' || data.emailSent === false) {
        showInvoiceFeedback(
          'error',
          `A számla PDF-je elkészült és rögzítve lett, de az e-mail nem ment ki: ${data.emailError || 'ismeretlen küldési hiba'}. A „Küldés újra” gombbal próbálkozhat ismét.`
        );
      } else if (data.emailStatus === 'already_sent') {
        showInvoiceFeedback(
          'success',
          `Ez a számla már korábban elküldésre került (${data.invoice?.invoice_number || 'TESZT'}).`
        );
      } else if (data.emailSent === true) {
        showInvoiceFeedback(
          'success',
          `Az e-mail és a PDF melléklet elküldése sikeres a(z) ${invoiceForm.customerEmail} címre. Számlaszám: ${data.invoice?.invoice_number || invoiceNumber}.`
        );
      } else {
        showInvoiceFeedback(
          'error',
          'A küldés eredménye nem ellenőrizhető. Ellenőrizze a számlák listáját, mielőtt újra próbálkozik.'
        );
      }
    } catch (error) {
      showInvoiceFeedback('error', error.message || 'A számla kiállítása nem sikerült.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const invoiceTotals = calculateInvoiceTotals(invoiceForm.items);

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[90dvh] max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto overscroll-y-contain">
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
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-engine">
                Számla adatai
              </p>
              <p className="mt-1 text-[12px] font-semibold text-brand-ember">
                MINTA · NEM VALÓDI SZÁMLA
              </p>
            </div>
            <button
              type="button"
              disabled={creatingInvoice || !invoiceForm.customerEmail || invoiceFeedback?.type === 'success'}
              onClick={createInvoice}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-brand-ember px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingInvoice ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> PDF és e-mail készül…</>
              ) : invoiceFeedback?.type === 'success' ? (
                <><CheckCircle2 className="h-4 w-4" /> E-mail elküldve</>
              ) : invoiceFeedback?.type === 'error' ? (
                'Küldés újra'
              ) : (
                'Minta számla küldése'
              )}
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
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-brand">Számlatételek és alkatrészek</h3>
            <button
              type="button"
              onClick={() => {
                setInvoiceForm((current) => ({
                  ...current,
                  items: [
                    ...current.items,
                    {
                      id: `${Date.now()}-${current.items.length}`,
                      name: '',
                      type: 'alkatresz',
                      quantity: '1',
                      unit: 'db',
                      grossUnitPrice: '0',
                      vatRate: '0.27',
                    },
                  ],
                }));
                setInvoiceFeedback(null);
              }}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-brand-silver bg-white px-3 text-[12px] font-semibold text-brand"
            >
              <Plus className="h-4 w-4" /> Tétel hozzáadása
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {invoiceForm.items.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-brand-silver bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-6">
                  <label className="text-[12px] font-medium text-brand-engine sm:col-span-3">
                    Tétel neve
                    <input
                      value={item.name}
                      onChange={(event) => updateInvoiceItem(index, 'name', event.target.value)}
                      placeholder="Pl. fékbetét, olajcsere munkadíj"
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver px-2 text-[13px] text-brand"
                    />
                  </label>
                  <label className="text-[12px] font-medium text-brand-engine sm:col-span-2">
                    Típus
                    <select
                      value={item.type}
                      onChange={(event) => updateInvoiceItem(index, 'type', event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver bg-white px-2 text-[13px] text-brand"
                    >
                      <option value="alkatresz">Alkatrész</option>
                      <option value="munkadij">Munkadíj</option>
                      <option value="egyeb">Egyéb</option>
                    </select>
                  </label>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceForm((current) => ({
                          ...current,
                          items: current.items.filter((_, itemIndex) => itemIndex !== index),
                        }));
                        setInvoiceFeedback(null);
                      }}
                      aria-label={`${item.name || 'Tétel'} törlése`}
                      className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-engine hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="text-[12px] font-medium text-brand-engine">
                    Mennyiség
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) => updateInvoiceItem(index, 'quantity', event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver px-2 text-[13px] text-brand"
                    />
                  </label>
                  <label className="text-[12px] font-medium text-brand-engine">
                    Egység
                    <input
                      value={item.unit}
                      onChange={(event) => updateInvoiceItem(index, 'unit', event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver px-2 text-[13px] text-brand"
                    />
                  </label>
                  <label className="text-[12px] font-medium text-brand-engine sm:col-span-2">
                    Egységár (bruttó Ft)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.grossUnitPrice}
                      onChange={(event) => updateInvoiceItem(index, 'grossUnitPrice', event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver px-2 text-[13px] text-brand"
                    />
                  </label>
                  <label className="text-[12px] font-medium text-brand-engine">
                    ÁFA-kulcs
                    <select
                      value={item.vatRate}
                      onChange={(event) => updateInvoiceItem(index, 'vatRate', event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-brand-silver bg-white px-2 text-[13px] text-brand"
                    >
                      <option value="0.27">27%</option>
                      <option value="0.18">18%</option>
                      <option value="0.05">5%</option>
                      <option value="0">0%</option>
                    </select>
                  </label>
                  <div className="flex items-end justify-end text-right text-[12px] text-brand-engine sm:col-span-2">
                    ÁFA: {formatMoneyHu(invoiceTotals.lines[index]?.vatTotal || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-brand-silver bg-white p-3">
            <div className="ml-auto grid max-w-sm grid-cols-2 gap-y-2 text-[13px]">
              <span className="text-brand-engine">Nettó összesen</span>
              <span className="text-right font-medium text-brand">{formatMoneyHu(invoiceTotals.net)}</span>
              <span className="text-brand-engine">ÁFA összesen</span>
              <span className="text-right font-medium text-brand">{formatMoneyHu(invoiceTotals.vat)}</span>
              <span className="font-semibold text-brand">Fizetendő bruttó</span>
              <span className="text-right font-semibold text-brand">{formatMoneyHu(invoiceTotals.gross)}</span>
            </div>
          </div>

          <label className="mt-4 block text-[13px] font-medium text-brand-engine">
            Számla megjegyzés / javítás leírása
            <textarea
              rows={3}
              value={invoiceForm.notes}
              onChange={(event) => updateInvoiceField('notes', event.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-silver bg-white p-3 text-[14px] text-brand"
            />
          </label>

          <p className="mt-3 rounded-lg bg-orange-50 p-3 text-[12px] leading-5 text-orange-900">
            Ez a PDF demonstrációs minta, nem hivatalos számla és nem használható könyvelési vagy adózási bizonylatként.
          </p>

          {invoiceFeedback && (
            <div
              role={invoiceFeedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-[13px] font-medium ${
                invoiceFeedback.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {invoiceFeedback.type === 'error'
                ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{invoiceFeedback.text}</span>
            </div>
          )}
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