import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCegAdat } from '@/components/CegAdatProvider';

const welcomeText = (cegadat) =>
  `Kedves Érdeklődő! Köszönöm, hogy felkereste a ${cegadat.name} oldalát. Én a ${cegadat.name} virtuális asszisztense vagyok, nem ember. Miben segíthetek?`;

const errorText = (cegadat) =>
  `Elnézést, most technikai akadályba ütköztem. Kérjük, próbálja újra később, vagy hívjon minket telefonon: ${cegadat.phone}.`;

export default function ChatWidget() {
  const cegadat = useCegAdat();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', welcome: true }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const response = await base44.functions.invoke('szervizChat', {
        messages: next.slice(-12),
      });
      const reply = response.data?.reply;
      setMessages([...next, { role: 'assistant', content: reply || errorText(cegadat) }]);
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: errorText(cegadat) }]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    send();
  };
const [showPopup, setShowPopup] = useState(false);

useEffect(() => {
  if (open) return;

  const timer = setTimeout(() => {
    setShowPopup(true);
  }, 4000);

  return () => clearTimeout(timer);
}, [open]);
  return (
    <>
    {showPopup && !open && (
  <div className="fixed bottom-[145px] top-auto right-3 z-50 w-[270px] max-w-[calc(100vw-24px)] rounded-2xl border border-brand-silver bg-white p-3 shadow-2xl sm:bottom-[100px] sm:right-5 sm:w-[320px] sm:p-5">
    <button
      onClick={() => setShowPopup(false)}
      className="absolute right-3 top-3 text-gray-400"
      aria-label="Bezárás"
    >
      <X className="h-4 w-4" />
    </button>

    <p className="mb-2 font-semibold text-brand">
      Kérdése van? Segítünk! 👋
    </p>

    <p className="mb-4 text-sm leading-relaxed text-gray-600">
      Virtuális asszisztensünk készséggel válaszol
      kérdéseire, segít szolgáltatásaink megismerésében
      és az időpontfoglalásban.
      Miben segíthetünk Önnek?
    </p>

    <button
      onClick={() => {
        setShowPopup(false);
        setOpen(true);
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-ember px-4 py-3 text-sm font-semibold text-white"
    >
       Beszélgetés indítása
      <ArrowRight className="h-4 w-4" />
    </button>

    {/* A chatbuborék farkincája */}
    <div
      className="absolute -bottom-2 right-7 h-4 w-4 rotate-45 border-r border-b border-brand-silver bg-white"
    />

  </div>
)}
      {open && (
        <div
          role="dialog"
          aria-label="Virtuális asszisztens"
          className="fixed bottom-[148px] right-4 z-50 flex max-h-[min(560px,calc(100vh-200px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-brand-silver bg-white shadow-[0_28px_70px_-24px_rgba(11,31,58,0.5)] sm:bottom-[92px] sm:right-6 sm:max-h-[min(560px,calc(100vh-140px))]"
        >
          <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
            <div className="relative h-10 w-10 shrink-0">
  <div className="h-full w-full overflow-hidden rounded-full border-2 border-white/20">
    <img
      src="https://media.easy-peasy.ai/56dc5465-4437-4512-b056-6d5ecef89abf/3f95425e-22be-4210-bb73-b51cc6d42447.png"
      alt="Virtuális asszisztens"
      className="h-full w-full object-cover"
    />
  </div>

  {/* Zöld online jelzés */}
  <span className="absolute bottom-0 right-0 flex h-3 w-3">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-green-500" />
  </span>
</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[15px] font-semibold">Virtuális asszisztens</p>
              <p className="text-[12px] text-white/65">{cegadat.name} · minta oldal</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chat bezárása"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-[14px] leading-[1.55] ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-brand text-white'
                      : 'rounded-bl-md border border-brand-silver bg-white text-brand'
                  }`}
                >
                  {message.welcome ? welcomeText(cegadat) : message.content}
                </p>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <span className="rounded-2xl rounded-bl-md border border-brand-silver bg-white px-4 py-3 text-[14px] text-brand-engine">
                  Írom a választ…
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-brand-silver bg-white px-4 pb-4 pt-3">
            <Link
              to="/idopont"
              onClick={() => setOpen(false)}
              className="mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brand-ember text-[12px] font-semibold uppercase tracking-[0.12em] text-white"
            >
              Időpontot kérek
              <ArrowRight className="h-4 w-4" />
            </Link>
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Üzenet az asszisztensnek
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Írja be kérdését…"
                maxLength={800}
                className="h-11 flex-1 rounded-full border border-brand-silver bg-white px-4 text-[14px] text-brand outline-none focus:border-brand-ember"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Üzenet elküldése"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-light disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Chat bezárása' : 'Chat megnyitása'}
        aria-expanded={open}
        className="fixed bottom-[76px] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-ember text-white shadow-[0_14px_34px_-10px_rgba(249,115,22,0.8)] transition-transform hover:scale-105 sm:bottom-5 sm:right-6 sm:h-16 sm:w-16"
      >
        {open ? (
  <X className="h-6 w-6" />
) : (
  <img
    src="https://media.easy-peasy.ai/56dc5465-4437-4512-b056-6d5ecef89abf/3f95425e-22be-4210-bb73-b51cc6d42447.png"
    alt="Chat"
    className="h-full w-full rounded-full object-cover"
  />
)}
{!open && (
  <span
    aria-hidden="true"
    className="absolute right-0 top-0 flex h-4 w-4"
  >
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-green-500" />
  </span>
)}
      </button>
    </>
  );
}