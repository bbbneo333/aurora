/* eslint-disable react/jsx-props-no-spreading */

import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import './app.component.css';
import * as AppPages from './pages';
import * as AppServices from './services';
import {Routes} from './constants';
import {MediaLibraryProvider} from "./contexts";

interface AppComponentProps {
  systemService: AppServices.SystemService;
  i18nService: AppServices.I18nService;
  collectionService: AppServices.CollectionService;
}

const AppRouterOutlet = (props: AppComponentProps) => {
  return (
    <BrowserRouter>
      <Switch>
        <Route
          path={Routes.HOME}
          render={routeProps => (
            <MediaLibraryProvider>
              <AppPages.HomeComponent {...routeProps} {...props} />
            </MediaLibraryProvider>
          )}
        />
      </Switch>
    </BrowserRouter>
  );
};

class AppComponent extends React.Component {
  private readonly i18nService: AppServices.I18nService;
  private readonly systemService: AppServices.SystemService;
  private readonly collectionService: AppServices.CollectionService;

  constructor(props: never) {
    super(props);
    // instantiate services
    this.systemService = new AppServices.SystemService();
    this.i18nService = new AppServices.I18nService({
      systemService: this.systemService
    });
    this.collectionService = new AppServices.CollectionService({
      systemService: this.systemService
    });
  }

  render() {
    const props = {
      systemService: this.systemService,
      i18nService: this.i18nService,
      collectionService: this.collectionService
    };
    return <AppRouterOutlet {...props} />;
  }
}

export const AppHotComponent = hot(module)(AppComponent);
