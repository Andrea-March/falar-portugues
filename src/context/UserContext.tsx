'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { firstNodeId } from '@/content';

const STORAGE_KEY = 'pt_app_user_progress_v1';

export interface UserProgress {
  completedNodeIds: string[];
  /** Sessioni completate per nodo (i nodi in completedNodeIds le hanno fatte tutte) */
  sessionProgress: Record<string, number>;
  /** Esercizi già proposti in una sessione: le sessioni successive privilegiano quelli nuovi */
  seenExerciseIds: string[];
  currentNodeId: string;
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
}

const DEFAULT_PROGRESS: UserProgress = {
  completedNodeIds: [],
  sessionProgress: {},
  seenExerciseIds: [],
  currentNodeId: firstNodeId,
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 1,
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
        setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(saved) });
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

  const addXp = (amount: number) => {
    saveProgress((p) => ({ ...p, xp: p.xp + amount }));
  };

  const markSeen = (exerciseIds: string[]) => {
    saveProgress((p) => ({ ...p, seenExerciseIds: Array.from(new Set([...p.seenExerciseIds, ...exerciseIds])) }));
  };

  return (
    <UserContext.Provider
      value={{ progress, completeNode, completeSession, loseHeart, addXp, markSeen, isLoaded }}
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