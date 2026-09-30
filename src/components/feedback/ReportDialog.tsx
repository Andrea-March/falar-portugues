'use client';

import React, { useState } from 'react';
import { REPORT_REASONS, type ReportReason } from '@/utils/feedbackSchema';
import { exerciseReportUrl, type ExerciseReport } from '@/utils/feedback';
import FeedbackDialog, { TrapField, useSendFeedback } from './FeedbackDialog';
import { ui } from '@/content';

/** Segnalazione di un esercizio: modulo chiuso (un motivo) con una nota facoltativa */
export default function ReportDialog({ report, onClose }: { report: ExerciseReport; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [trap, setTrap] = useState('');
  const { status, send } = useSendFeedback();

  const needsNote = reason === 'other';
  const canSend = reason !== null && (!needsNote || note.trim().length > 0) && status !== 'sending';
  const submit = () => {
    if (!canSend || !reason) return;
    void send(
      {
        kind: 'exercise',
        reason,
        message: note.trim(),
        exercise: {
          id: report.exerciseId,
          sentence: report.sentence,
          correctAnswer: report.correctAnswer,
          answer: report.answer ?? '',
        },
      },
      trap,
    );
  };

  return (
    <FeedbackDialog
      title={ui.report.title}
      subtitle={ui.report.subtitle}
      status={status}
      onClose={onClose}
      onRetry={submit}
      fallbackMailto={exerciseReportUrl(report)}
    >
      <div role="radiogroup" aria-label={ui.report.reason} className="grid gap-2">
        {REPORT_REASONS.map((r) => {
          const selected = reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setReason(r.id)}
              className={`w-full text-left rounded-2xl border-2 border-b-4 px-4 py-3 font-bold transition-colors cursor-pointer ${
                selected
                  ? 'bg-azulejo-light !border-azulejo text-azulejo-dark'
                  : 'bg-white border-brand-border text-ink hover:bg-brand-background'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-azulejo bg-azulejo' : 'border-brand-border'}`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {ui.report.reasons[r.id]}
              </span>
            </button>
          );
        })}
      </div>

      <label className="block mt-4">
        <span className="font-bold text-ink">{needsNote ? ui.report.noteRequired : ui.report.noteOptional}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder={reason === 'not_accepted' ? ui.report.notAcceptedExample : ''}
          className="mt-1.5 w-full rounded-2xl border-2 border-brand-border bg-white px-4 py-3 text-ink font-semibold focus:outline-none focus:border-azulejo resize-none"
        />
      </label>
      <TrapField value={trap} onChange={setTrap} />

      <p className="mt-2 text-sm font-semibold text-brand-muted">
        {ui.report.includes}
      </p>

      <button type="button" disabled={!canSend} onClick={submit} className="btn-3d btn-primary w-full py-3.5 text-lg mt-4">
        {status === 'sending' ? ui.common.sending : ui.common.send}
      </button>
    </FeedbackDialog>
  );
}
