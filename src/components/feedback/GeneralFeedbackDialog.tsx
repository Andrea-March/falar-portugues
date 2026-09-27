'use client';

import React, { useState } from 'react';
import { generalFeedbackUrl } from '@/utils/feedback';
import FeedbackDialog, { TrapField, useSendFeedback } from './FeedbackDialog';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Feedback generale: modulo aperto, con email facoltativa per ricevere una risposta */
export default function GeneralFeedbackDialog({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const { status, send } = useSendFeedback();

  const emailOk = email.trim() === '' || EMAIL_RE.test(email.trim());
  const canSend = message.trim().length > 0 && emailOk && status !== 'sending';
  const submit = () => {
    if (canSend) void send({ kind: 'general', message: message.trim(), email: email.trim() }, trap);
  };

  const field =
    'mt-1.5 w-full rounded-2xl border-2 border-brand-border bg-white px-4 py-3 text-ink font-semibold focus:outline-none focus:border-azulejo';

  return (
    <FeedbackDialog
      title="Enviar feedback"
      subtitle="Cosa ti piace, cosa manca, cosa non funziona: tutto è utile."
      status={status}
      onClose={onClose}
      onRetry={submit}
      fallbackMailto={generalFeedbackUrl()}
    >
      <label className="block">
        <span className="font-bold text-ink">Il tuo messaggio</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={3000}
          rows={5}
          autoFocus
          className={`${field} resize-none`}
        />
      </label>

      <label className="block mt-4">
        <span className="font-bold text-ink">La tua email (facoltativa)</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          aria-invalid={!emailOk}
          className={`${field} ${emailOk ? '' : '!border-ko'}`}
        />
        <span className="block mt-1 text-sm font-semibold text-brand-muted">
          {emailOk ? 'Solo se vuoi una risposta. La usiamo solo per risponderti.' : 'Controlla l’indirizzo email.'}
        </span>
      </label>
      <TrapField value={trap} onChange={setTrap} />

      <button type="button" disabled={!canSend} onClick={submit} className="btn-3d btn-primary w-full py-3.5 text-lg mt-5">
        {status === 'sending' ? 'A enviar…' : 'Enviar'}
      </button>
    </FeedbackDialog>
  );
}
