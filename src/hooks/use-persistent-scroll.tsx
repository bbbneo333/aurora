import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type UsePersistentScrollProps = {
  viewportRef: React.RefObject<HTMLDivElement>;
};

// local store for storing scroll position per location
const scrollStore = new Map<string, number>();

export function usePersistentScroll({ viewportRef }: UsePersistentScrollProps) {
  const location = useLocation();

  // restore scrollTop when route changes
  useEffect(() => {
    const container = viewportRef.current;
    const scrollKey = location.key;

    if (!container || !scrollKey) return;

    const scrollPosition = scrollStore.get(scrollKey);

    // delay until after content has rendered
    requestAnimationFrame(() => {
      if (scrollPosition) {
        // console.log('usePersistentScroll: persisting', scrollPosition, scrollKey, location.pathname);
        container.scrollTop = scrollPosition;
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
    const scrollKey = location.key;

    if (!container || !scrollKey) return;

    const saveScroll = () => {
      const scrollPosition = container.scrollTop;
      if (!scrollPosition) {
        return;
      }

      // console.log('usePersistentScroll: saving', scrollPosition, scrollKey, location.pathname);
      scrollStore.set(scrollKey, scrollPosition);
    };

    // listen to scroll events
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
