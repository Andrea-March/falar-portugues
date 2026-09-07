'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'pt_app_user_progress_v1';

export interface UserProgress {
  completedNodeIds: string[];
  currentNodeId: string;
  xp: number;
  hearts: number;
  maxHearts: number;
  streak: number;
}

const DEFAULT_PROGRESS: UserProgress = {
  completedNodeIds: [],
  currentNodeId: 'node_1_1',
  xp: 0,
  hearts: 5,
  maxHearts: 5,
  streak: 1,
};

interface UserContextType {
  progress: UserProgress;
  completeNode: (nodeId: string, nextNodeId?: string, earnedXp?: number) => void;
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
        setProgress(JSON.parse(saved));
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
      value={{ progress, completeNode, loseHeart, addXp, isLoaded }}
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