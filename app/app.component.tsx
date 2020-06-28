/* eslint-disable react/jsx-props-no-spreading */

import {hot} from 'react-hot-loader';
import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import './app.component.css';
import * as AppConstants from './constants';
import * as AppPages from './pages';

import {I18nService, SystemService} from './services';

interface AppComponentProps {
  systemService: SystemService;
  i18nService: I18nService;
}

const AppRouterOutlet = (props: AppComponentProps) => {
  return (
    <BrowserRouter>
      <Switch>
        <Route
          path={AppConstants.Routes.HOME}
          render={routeProps => (
            <AppPages.HomeComponent {...routeProps} {...props} />
          )}
        />
      </Switch>
    </BrowserRouter>
  );
};

class AppComponent extends React.Component {
  private readonly i18nService: I18nService;
  private readonly systemService: SystemService;

  constructor(props: never) {
    super(props);
    //
    this.systemService = new SystemService();
    this.i18nService = new I18nService({
      systemService: this.systemService
    });
  }

  render() {
    const props = {
      systemService: this.systemService,
      i18nService: this.i18nService
    };
    return <AppRouterOutlet {...props} />;
  }
}

export const AppHotComponent = hot(module)(AppComponent);
