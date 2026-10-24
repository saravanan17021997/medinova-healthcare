import { useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { integrations } from '@/integrations';

/**
 * Optional AI chatbot. Hidden unless VITE_CHATBOT_ENABLED=true and
 * VITE_CHATBOT_URL points at a hosted chatbot page (for example a Chatbase
 * iframe URL or your own n8n-backed bot).
 */
export function ChatbotLauncher() {
  const [open, setOpen] = useState(false);
  if (!integrations.chatbot.enabled) return null;
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="h-[520px] w-[min(92vw,380px)] overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-line">
          <iframe title="SaraDev assistant" src={integrations.chatbot.url} className="h-full w-full border-0" />
        </div>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lift" aria-expanded={open} aria-label={open ? 'Close assistant' : 'Open assistant'}>
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageSquareText className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
