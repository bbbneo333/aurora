import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Debug from 'debug';

import {MediaSessionComponent, MediaSidebarComponent, MediaPlayerRibbonComponent} from './components';
import {Routes} from './constants';
import {MediaLocalProvider} from './providers';
import {MediaProviderService} from './services';
import * as AppPages from './pages';

import './app.global.css';

const debug = Debug('app:component:app_component');

debug('chromium version - %s', window.app.versions.chrome);

// register providers
const mediaLocalProvider = new MediaLocalProvider();
MediaProviderService.addMediaProvider(mediaLocalProvider);

export function AppComponent() {
  return (
    <div>
      <MediaSessionComponent/>
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
