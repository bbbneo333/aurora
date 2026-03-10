import React, { useEffect, useState } from 'react';

/**
 * Observes layout for an element reference and returns height and width
 */
export function useElementSize(ref: React.MutableRefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      requestAnimationFrame(() => {
        setSize((prev) => {
          const sizeUnchanged = prev.width === width && prev.height === height;

          if (sizeUnchanged) {
            return prev;
          }

          return { width, height };
        });
      });
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [
    ref,
  ]);

  return size;
}
