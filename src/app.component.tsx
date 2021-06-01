import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import * as _ from 'lodash';
import Debug from 'debug';

import {MediaSessionComponent, MediaSidebarComponent, MediaPlayerRibbonComponent} from './components';
import {Routes} from './constants';
import {MediaLocalProvider} from './providers';
import {MediaProviderService} from './services';
import * as AppPages from './pages';

const debug = Debug('app:component:app_component');

debug('chromium version - %s', _.get(process, 'versions.chrome'));

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
