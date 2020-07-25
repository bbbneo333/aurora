import React, {createContext} from 'react';

import * as AppServices from '../services';

export const AppContext = createContext<{
  systemService: AppServices.SystemService,
  i18nService: AppServices.I18nService,
} | null>(null);

export function AppContextProvider(props: { children: React.ReactNode }) {
  const {children} = props;
  // instantiate services
  const systemService = new AppServices.SystemService();
  const i18nService = new AppServices.I18nService({
    systemService,
  });
  // instantiate provider
  const provider = {
    systemService,
    i18nService,
  };

  return (
    <AppContext.Provider value={provider}>
      {children}
    </AppContext.Provider>
  );
}
