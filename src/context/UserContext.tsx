'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { firstNodeId } from '@/content';

const STORAGE_KEY = 'pt_app_user_progress_v1';

export interface UserProgress {
  completedNodeIds: string[];
  /** Sessioni completate per nodo (i nodi in completedNodeIds le hanno fatte tutte) */
  sessionProgress: Record<string, number>;
  currentNodeId: string;
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
}

const DEFAULT_PROGRESS: UserProgress = {
  completedNodeIds: [],
  sessionProgress: {},
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

  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const completeNode = (nodeId: string, nextNodeId?: string, earnedXp = 15) => {
    const updatedCompleted = Array.from(new Set([...progress.completedNodeIds, nodeId]));
    saveProgress({
      ...progress,
      completedNodeIds: updatedCompleted,
      currentNodeId: nextNodeId || progress.currentNodeId,
      xp: progress.xp + earnedXp,
    });
  };

  const completeSession = (nodeId: string, sessionIndex: number, totalSessions: number, nextNodeId?: string) => {
    const done = Math.max(progress.sessionProgress[nodeId] ?? 0, sessionIndex + 1);
    const finished = done >= totalSessions;
    saveProgress({
      ...progress,
      sessionProgress: { ...progress.sessionProgress, [nodeId]: done },
      completedNodeIds: finished ? Array.from(new Set([...progress.completedNodeIds, nodeId])) : progress.completedNodeIds,
      currentNodeId: finished && nextNodeId && !progress.completedNodeIds.includes(nodeId) ? nextNodeId : progress.currentNodeId,
    });
  };

  const loseHeart = () => {
    if (progress.hearts > 0) {
      saveProgress({
        ...progress,
        hearts: progress.hearts - 1,
      });
    }
  };

  const addXp = (amount: number) => {
    saveProgress({
      ...progress,
      xp: progress.xp + amount,
    });
  };

  return (
    <UserContext.Provider
      value={{ progress, completeNode, completeSession, loseHeart, addXp, isLoaded }}
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