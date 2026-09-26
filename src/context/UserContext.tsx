'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { firstNodeId } from '@/content';
import { updateReview, type ReviewState } from '@/content/review';
import { dayKey, nextStreak, visibleStreak } from '@/content/rewards';

const STORAGE_KEY = 'pt_app_user_progress_v1';

export interface UserProgress {
  completedNodeIds: string[];
  /** Sessioni completate per nodo (i nodi in completedNodeIds le hanno fatte tutte) */
  sessionProgress: Record<string, number>;
  /** Esercizi già proposti in una sessione: le sessioni successive privilegiano quelli nuovi */
  seenExerciseIds: string[];
  /** Ripasso: per ogni cosa allenata (espressione, forma verbale) casella e scadenza */
  review: ReviewState;
  currentNodeId: string;
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  /** Ultimo giorno con almeno una sessione conclusa (es. "2026-09-26") */
  lastActiveDay?: string;
  /** Onboarding fatto */
  onboarded: boolean;
  /** Obiettivo giornaliero in XP (scelto nell'onboarding) */
  dailyGoal: number;
  /** Perché si impara (dall'onboarding) */
  motivation?: string;
  /** XP guadagnati in xpDay */
  xpToday: number;
  xpDay?: string;
}

const DEFAULT_PROGRESS: UserProgress = {
  completedNodeIds: [],
  sessionProgress: {},
  seenExerciseIds: [],
  review: {},
  currentNodeId: firstNodeId,
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 0,
  onboarded: false,
  dailyGoal: 30,
  xpToday: 0,
};

interface UserContextType {
  progress: UserProgress;
  completeNode: (nodeId: string, nextNodeId?: string, earnedXp?: number) => void;
  /**
   * Segna fatta la sessione `sessionIndex` (da 0) di un nodo con `totalSessions` sessioni.
   * All'ultima il nodo è completato e si passa al successivo. Rifare una sessione
   * già fatta non cambia niente.
   */
  completeSession: (nodeId: string, sessionIndex: number, totalSessions: number, nextNodeId?: string) => void;
  loseHeart: () => void;
  addXp: (amount: number) => void;
  /** Segna come visti gli esercizi di una sessione appena conclusa */
  markSeen: (exerciseIds: string[]) => void;
  /** Esito al primo tentativo di un esercizio, per il ripasso */
  recordAnswer: (trains: string[] | undefined, correct: boolean) => void;
  completeOnboarding: (choices: { dailyGoal: number; motivation?: string }) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        // Unione con i valori predefiniti: i salvataggi vecchi non hanno i campi nuovi
        const parsed = JSON.parse(saved);
        const loaded: UserProgress = {
          ...DEFAULT_PROGRESS,
          ...parsed,
          // Chi usava l'app prima dell'onboarding non deve rifarlo
          onboarded: parsed.onboarded ?? (parsed.xp ?? 0) > 0,
        };
        // Se ieri e oggi non si è studiato, la streak è interrotta
        setProgress({ ...loaded, streak: visibleStreak(loaded.streak, loaded.lastActiveDay) });
      } catch (e) {
        console.error('Errore nel caricamento del localStorage:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  /** Aggiorna e salva a partire dallo stato più recente: più aggiornamenti di fila non si sovrascrivono */
  const saveProgress = (update: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = update(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const completeNode = (nodeId: string, nextNodeId?: string, earnedXp = 15) => {
    saveProgress((p) => ({
      ...p,
      completedNodeIds: Array.from(new Set([...p.completedNodeIds, nodeId])),
      currentNodeId: nextNodeId || p.currentNodeId,
      xp: p.xp + earnedXp,
    }));
  };

  const completeSession = (nodeId: string, sessionIndex: number, totalSessions: number, nextNodeId?: string) => {
    saveProgress((p) => {
      const done = Math.max(p.sessionProgress[nodeId] ?? 0, sessionIndex + 1);
      const finished = done >= totalSessions;
      return {
        ...p,
        sessionProgress: { ...p.sessionProgress, [nodeId]: done },
        completedNodeIds: finished ? Array.from(new Set([...p.completedNodeIds, nodeId])) : p.completedNodeIds,
        currentNodeId: finished && nextNodeId && !p.completedNodeIds.includes(nodeId) ? nextNodeId : p.currentNodeId,
      };
    });
  };

  const loseHeart = () => {
    saveProgress((p) => (p.hearts > 0 ? { ...p, hearts: p.hearts - 1 } : p));
  };

  /** Fine di una sessione: aggiunge gli XP e tiene viva la streak (anche con 0 XP, es. test non superato) */
  const addXp = (amount: number) => {
    saveProgress((p) => {
      const today = dayKey();
      return {
        ...p,
        xp: p.xp + amount,
        xpToday: (p.xpDay === today ? p.xpToday : 0) + amount,
        xpDay: today,
        streak: nextStreak(p.streak, p.lastActiveDay),
        lastActiveDay: today,
      };
    });
  };

  const recordAnswer = (trains: string[] | undefined, correct: boolean) => {
    if (!trains?.length) return;
    saveProgress((p) => {
      const review = { ...p.review };
      for (const ref of trains) review[ref] = updateReview(review[ref], correct);
      return { ...p, review };
    });
  };

  const completeOnboarding = (choices: { dailyGoal: number; motivation?: string }) => {
    saveProgress((p) => ({ ...p, ...choices, onboarded: true }));
  };

  const markSeen = (exerciseIds: string[]) => {
    saveProgress((p) => ({ ...p, seenExerciseIds: Array.from(new Set([...p.seenExerciseIds, ...exerciseIds])) }));
  };

  return (
    <UserContext.Provider
      value={{ progress, completeNode, completeSession, loseHeart, addXp, markSeen, recordAnswer, completeOnboarding, isLoaded }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve essere usato all'interno di un UserProvider");
  }
  return context;
}