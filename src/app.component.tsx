import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import * as AppPages from './pages';

import {MediaSidebarComponent, MediaPlayerRibbonComponent} from './components';
import {Routes} from './constants';
import {MediaLocalProvider} from './providers';
import {MediaProviderService} from './services';

// register providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.addMediaProvider(mediaLocalProvider);

export function AppComponent() {
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
