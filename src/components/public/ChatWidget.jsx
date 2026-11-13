import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, ArrowRight } from 'lucide-react';
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

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Virtuális asszisztens"
          className="fixed bottom-[148px] right-4 z-50 flex max-h-[min(560px,calc(100vh-200px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-brand-silver bg-white shadow-[0_28px_70px_-24px_rgba(11,31,58,0.5)] sm:bottom-[92px] sm:right-6 sm:max-h-[min(560px,calc(100vh-140px))]"
        >
          <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ember/15 text-brand-ember">
              <MessageCircle className="h-5 w-5" />
            </span>
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
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 flex h-3.5 w-3.5"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </span>
        )}
      </button>
    </>
  );
}