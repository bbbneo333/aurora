import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import * as AppPages from './pages';
import * as AppContexts from './contexts';

import {MediaSidebarComponent, MediaPlayerRibbonComponent} from './components';
import {Routes} from './constants';

function AppComponent() {
  return (
    <AppContexts.MediaLibraryProvider>
      <AppContexts.MediaPlayerProvider>
        <MediaSidebarComponent/>
        <MediaPlayerRibbonComponent/>
        <BrowserRouter>
          <Switch>
            <Route
              path={Routes.HOME}
              render={() => (
                <AppPages.HomeComponent/>
              )}
            />
          </Switch>
        </BrowserRouter>
      </AppContexts.MediaPlayerProvider>
    </AppContexts.MediaLibraryProvider>
  );
}

export const AppHotComponent = hot(module)(AppComponent);
