import { useEffect, useState } from 'react';
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

export default function RequestDetail({ request, onClose, onStatusChange, onNoteSaved }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setNote(request?.internal_note || '');
    setMessage('');
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

        <div className="flex items-center justify-between gap-4 rounded-lg bg-[#F8FAFC] px-4 py-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-engine">
            Státusz
          </span>
          <StatusSelect
            value={request.status}
            onChange={(status) => onStatusChange(request.id, status)}
          />
        </div>

        <div className="mt-2">
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
        </div>

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