import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import './app.component.css';
import * as AppPages from './pages';
import * as AppConstants from './constants';
import * as AppContexts from "./contexts";

function AppComponent() {
  return (
    <AppContexts.AppContextProvider>
      <BrowserRouter>
        <Switch>
          <Route
            path={AppConstants.Routes.HOME}
            render={() => (
              <AppContexts.MediaLibraryProvider>
                <AppPages.HomeComponent/>
              </AppContexts.MediaLibraryProvider>
            )}
          />
        </Switch>
      </BrowserRouter>
    </AppContexts.AppContextProvider>
  );
}

export const AppHotComponent = hot(module)(AppComponent);
