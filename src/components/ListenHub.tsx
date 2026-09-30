'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Eye, EyeOff, Headphones, Languages, Pause, Play, RotateCcw, Turtle } from 'lucide-react';
import { formatTime, isTimed, recordings, recordingUrl, segmentAt, type Recording } from '@/content/recordings';
import { stopSpeaking } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';
import { ui } from '@/content';

/** Velocità "piano": abbastanza lenta da aiutare, senza deformare la voce */
const SLOW_RATE = 0.8;

/** Tab Ascolto: registrazioni vere, prima senza testo e poi con il testo sincronizzato */
export default function ListenHub() {
  const [open, setOpen] = useState<Recording | null>(null);

  if (open) return <Player key={open.id} recording={open} onBack={() => setOpen(null)} />;

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">{ui.listen.title}</h2>
        <p className="font-semibold text-brand-muted">{ui.listen.subtitle}</p>
      </header>
      <section className="space-y-3">
        {recordings.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              soundFX.playClick();
              setOpen(r);
            }}
            className="btn-3d w-full !justify-between bg-white border-2 border-brand-border !border-b-[5px] px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-2xl bg-azulejo-light text-azulejo-dark flex items-center justify-center shrink-0" aria-hidden="true">
                <Headphones size={22} strokeWidth={2.6} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl font-extrabold text-ink leading-tight">{r.title}</span>
                <span className="block text-sm font-semibold text-brand-muted">{r.subtitle}</span>
                {r.level && <span className="block text-sm font-extrabold text-azulejo-dark mt-0.5">{r.level}</span>}
              </span>
            </span>
            <ChevronRight size={22} strokeWidth={2.8} className="text-brand-muted shrink-0" />
          </button>
        ))}
      </section>
    </div>
  );
}

function Player({ recording, onBack }: { recording: Recording; onBack: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [slow, setSlow] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [failed, setFailed] = useState(false);
  const timed = isTimed(recording);
  const current = segmentAt(recording, time);

  // La voce dell'app non si sovrappone alla registrazione
  useEffect(() => stopSpeaking(), []);

  useEffect(() => {
    if (audio.current) {
      audio.current.playbackRate = slow ? SLOW_RATE : 1;
      audio.current.preservesPitch = true;
    }
  }, [slow]);


  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      stopSpeaking();
      a.play().catch(() => setFailed(true));
    } else a.pause();
  };

  const seek = (t: number) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, duration || t));
    setTime(a.currentTime);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        type="button"
        onClick={() => {
          soundFX.playClick();
          audio.current?.pause();
          onBack();
        }}
        className="flex items-center gap-1.5 font-extrabold text-brand-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} strokeWidth={2.8} />
        {ui.listen.title}
      </button>

      <div className="rounded-3xl border-2 border-b-[6px] border-brand-border bg-white p-5 space-y-5">
        <header>
          <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">{recording.title}</h2>
          <p className="font-semibold text-brand-muted">{recording.subtitle}</p>
        </header>

        <audio
          ref={audio}
          src={recordingUrl(recording)}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = slow ? SLOW_RATE : 1;
          }}
          onError={() => setFailed(true)}
        />

        {failed ? (
          <p role="alert" className="rounded-2xl bg-ko-light text-ko-dark font-bold px-4 py-3">{ui.listen.error}</p>
        ) : (
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(time, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={ui.listen.position}
              aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
              className="w-full accent-azulejo"
            />
            <div className="flex justify-between text-sm font-bold text-brand-muted tabular-nums">
              <span>{formatTime(time)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => seek(time - 5)}
                aria-label={ui.listen.back5}
                title={ui.listen.back5}
                className="btn-3d w-14 h-14 bg-white border-brand-border text-azulejo-dark !border-b-4"
              >
                <RotateCcw size={22} strokeWidth={2.6} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? ui.listen.pause : ui.listen.play}
                className="btn-3d w-20 h-20 rounded-full bg-azulejo border-azulejo-dark text-white"
              >
                {playing ? <Pause size={34} strokeWidth={2.6} aria-hidden="true" /> : <Play size={34} strokeWidth={2.6} className="ml-1" aria-hidden="true" />}
              </button>
              <button
                type="button"
                aria-pressed={slow}
                onClick={() => {
                  soundFX.playClick();
                  setSlow((s) => !s);
                }}
                aria-label={ui.listen.slow}
                title={ui.listen.slow}
                className={`btn-3d w-14 h-14 !border-b-4 ${slow ? 'bg-azulejo-light border-azulejo text-azulejo-dark' : 'bg-white border-brand-border text-brand-muted'}`}
              >
                <Turtle size={24} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {!showText && <p className="text-center font-semibold text-brand-muted leading-snug">{ui.listen.tip}</p>}

        {/* Testo sincronizzato: solo la frase di prima, quella che si sente e quella dopo,
            proprio sotto i comandi, così la pausa è sempre a portata di dito */}
        {showText && timed && (
          <ol className="space-y-2" aria-live="polite">
            {[current - 1, Math.max(current, 0), Math.max(current, 0) + 1]
              .filter((i, k, all) => i >= 0 && i < recording.segments.length && all.indexOf(i) === k)
              .map((i) => {
                const s = recording.segments[i];
                const active = i === current;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        seek(s.at ?? 0);
                        if (audio.current?.paused) toggle();
                      }}
                      className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors cursor-pointer ${
                        active ? 'bg-azulejo border-azulejo-dark text-white' : 'bg-white border-brand-border text-brand-muted'
                      }`}
                    >
                      <span className={`block font-bold leading-snug ${active ? 'text-lg' : 'text-base'}`}>{s.text}</span>
                      {showTranslation && <span className={`block text-sm font-semibold ${active ? 'text-white/85' : 'text-brand-muted/80'}`}>{s.translation}</span>}
                    </button>
                  </li>
                );
              })}
          </ol>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={showText}
            onClick={() => {
              soundFX.playClick();
              setShowText((v) => !v);
            }}
            className="btn-3d py-3 gap-2 bg-white border-2 border-brand-border text-ink !border-b-4"
          >
            {showText ? <EyeOff size={18} strokeWidth={2.6} aria-hidden="true" /> : <Eye size={18} strokeWidth={2.6} aria-hidden="true" />}
            {showText ? ui.listen.hideText : ui.listen.showText}
          </button>
          <button
            type="button"
            aria-pressed={showTranslation}
            disabled={!showText}
            onClick={() => {
              soundFX.playClick();
              setShowTranslation((v) => !v);
            }}
            className="btn-3d py-3 gap-2 bg-white border-2 border-brand-border text-ink !border-b-4"
          >
            <Languages size={18} strokeWidth={2.6} aria-hidden="true" />
            {showTranslation ? ui.listen.hideTranslation : ui.listen.showTranslation}
          </button>
        </div>
      </div>

      {/* Senza i tempi delle frasi non si può seguire: si mostra tutto il testo */}
      {showText && !timed && (
        <ol className="space-y-2 animate-fade-in">
          {recording.segments.map((s, i) => (
            <li key={i} className="rounded-2xl border-2 border-brand-border bg-white px-4 py-3 text-ink">
              <span className="block text-lg font-bold leading-snug">{s.text}</span>
              {showTranslation && <span className="block font-semibold text-brand-muted">{s.translation}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
