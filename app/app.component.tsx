import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import * as AppPages from './pages';

import {MediaSidebarComponent, MediaPlayerRibbonComponent} from './components';
import {Routes} from './constants';

function AppComponent() {
  return (
    <div>
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
    </div>
  );
}

export const AppHotComponent = hot(module)(AppComponent);
