import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type UsePersistentScrollProps = {
  viewportRef: React.RefObject<HTMLDivElement>;
};

// local store for storing scroll position per location
const scrollStore = new Map<string, number>();

export function usePersistentScroll({ viewportRef }: UsePersistentScrollProps) {
  const location = useLocation();

  // save
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

  // restore
  useEffect(() => {
    const container = viewportRef.current;
    const scrollKey = location.key;

    if (!container || !scrollKey) return;

    const scrollPosition = scrollStore.get(scrollKey);

    if (scrollPosition === undefined) {
      container.scrollTop = 0;
      return;
    }

    let frame: number;

    // wait for page to have a height - a hack to determine whether page has content, then restore
    const tryRestore = () => {
      if (container.scrollHeight < scrollPosition + container.clientHeight) {
        frame = requestAnimationFrame(tryRestore);
        return;
      }

      // console.log('usePersistentScroll: restoring', scrollPosition, scrollKey, location.pathname);
      container.scrollTop = scrollPosition;
    };

    frame = requestAnimationFrame(tryRestore);

    // eslint-disable-next-line consistent-return
    return () => cancelAnimationFrame(frame);
  }, [
    location,
    viewportRef,
  ]);
}
