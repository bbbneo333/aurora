import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import * as AppPages from './pages';
import * as AppConstants from './constants';
import * as AppContexts from './contexts';

import './app.component.css';

function AppComponent() {
  return (
    <AppContexts.AppContextProvider>
      <AppContexts.MediaLibraryProvider>
        <AppContexts.MediaPlayerProvider>
          <BrowserRouter>
            <Switch>
              <Route
                path={AppConstants.Routes.HOME}
                render={() => (
                  <AppPages.HomeComponent/>
                )}
              />
            </Switch>
          </BrowserRouter>
        </AppContexts.MediaPlayerProvider>
      </AppContexts.MediaLibraryProvider>
    </AppContexts.AppContextProvider>
  );
}

export const AppHotComponent = hot(module)(AppComponent);
