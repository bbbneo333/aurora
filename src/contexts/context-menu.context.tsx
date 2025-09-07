import React, { useCallback, useState } from 'react';
import { ShowContextMenuParams, useContextMenu as useMenu } from 'react-contexify';

export type ContextMenuContextType<T> = {
  showMenu: (params: ShowContextMenuParams) => void;
  menuProps: T;
  hideAll: () => void;
};

const ContextMenuContext = React.createContext<ContextMenuContextType<any> | null>(null);

export function ContextMenuProvider<T>(props: {
  children: React.ReactNode,
}) {
  const { children } = props;
  const [menuProps, setMenuProps] = useState<T>();
  const { show, hideAll } = useMenu();

  const showMenu = useCallback((params: ShowContextMenuParams) => {
    setMenuProps(params.props as T);
    show(params);
  }, [
    show,
  ]);

  return (
    <ContextMenuContext.Provider value={{ menuProps, showMenu, hideAll }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu<T = any>() {
  const context = React.useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within ContextMenuContext');
  }
  return context as ContextMenuContextType<T>;
}
