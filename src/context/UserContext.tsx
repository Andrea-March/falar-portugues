'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { updateReview } from '@/content/review';
import { dayKey, nextStreak } from '@/content/rewards';
import { DEFAULT_PROGRESS, type UserProgress } from '@/progress/model';
import { getProgress, getServerProgress, subscribeProgress, updateProgress } from '@/progress/store';

export type { UserProgress } from '@/progress/model';

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
  // null solo sul server e durante l'idratazione: poi arrivano i progressi salvati
  const loaded = useSyncExternalStore(subscribeProgress, getProgress, getServerProgress);
  const progress = loaded ?? DEFAULT_PROGRESS;
  const isLoaded = loaded !== null;

  // I progressi stanno solo sul dispositivo: chiediamo al browser di non cancellarli
  // quando serve spazio (o, su Safari, dopo giorni senza visite). Se rifiuta, cambia nulla.
  useEffect(() => {
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!storage?.persist) return;
    storage
      .persisted()
      .then((already) => (already ? true : storage.persist()))
      .catch(() => undefined);
  }, []);

  const saveProgress = updateProgress;

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