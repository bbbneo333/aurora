import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type UsePersistentScrollProps = {
  viewportRef: React.RefObject<HTMLDivElement>;
};

export function usePersistentScroll({ viewportRef }: UsePersistentScrollProps) {
  const location = useLocation();

  // restore scrollTop when route changes
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const savedY = sessionStorage.getItem(`scroll-${location.key}`);

    // delay until after content has rendered
    requestAnimationFrame(() => {
      if (savedY !== null) {
        // console.log('usePersistentScroll: persisting', savedY, location.key, location.pathname);
        container.scrollTop = Number(savedY);
      } else {
        container.scrollTop = 0; // default for fresh navigation
      }
    });
  }, [
    location,
    viewportRef,
  ]);

  // save scrollTop whenever unmounting / navigating away
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const saveScroll = () => {
      const scroll = container.scrollTop;
      if (!scroll) {
        return;
      }

      // console.log('usePersistentScroll: saving', scroll, location.key, location.pathname);
      sessionStorage.setItem(`scroll-${location.key}`, String(scroll));
    };

    // save when tab is closing
    container.addEventListener('scroll', saveScroll);

    // save when unmounting or route changes
    // eslint-disable-next-line consistent-return
    return () => {
      saveScroll();
      container.removeEventListener('scroll', saveScroll);
    };
  }, [
    location,
    viewportRef,
  ]);
}
