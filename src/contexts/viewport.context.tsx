import React from 'react';

import { useElementSize, usePersistentScroll } from '../hooks';

export type Viewport = {
  viewportRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
};

export type ViewportProviderProps = {} & React.DetailsHTMLAttributes<HTMLDivElement>;

export const ViewportContext = React.createContext<Viewport | null>(null);

export function ViewportProvider(props: ViewportProviderProps) {
  const { children, ...rest } = props;

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(viewportRef);

  usePersistentScroll({ viewportRef });

  return (
    <ViewportContext.Provider value={{ viewportRef, width, height }}>
      <div ref={viewportRef} {...rest}>
        {children}
      </div>
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const ctx = React.useContext(ViewportContext);
  if (!ctx) {
    throw new Error('useViewport must be called within ViewportContext');
  }

  return ctx;
}
