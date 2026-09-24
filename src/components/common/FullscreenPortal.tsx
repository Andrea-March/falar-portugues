'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

/**
 * Rende i figli direttamente in <body>, fuori da qualsiasi contenitore.
 * Così una schermata a tutto schermo copre sempre header e nav, anche se viene
 * aperta dentro un elemento animato o trasformato (che creerebbe un nuovo
 * stacking context e "intrappolerebbe" lo z-index).
 * Blocca anche lo scroll della pagina sottostante finché è aperta.
 */
export default function FullscreenPortal({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return isClient ? createPortal(children, document.body) : null;
}
