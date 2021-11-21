import React from 'react';
import {Redirect, Route as RouteComponent, Switch} from 'react-router-dom';

export type Route = {
  path: string,
  exact?: boolean,
  component?: () => JSX.Element,
  redirect?: string,
};

export function RouterSwitchComponent(props: {
  routes: Route[],
}) {
  const {
    routes,
  } = props;

  return (
    <Switch>
      {routes.map((route) => {
        if (route.component) {
          return (
            <RouteComponent
              key={`route-${route.path}`}
              exact={route.exact}
              path={route.path}
            >
              {
                React.createElement(route.component, {
                  key: `route-${route.path}`,
                })
              }
            </RouteComponent>
          );
        }
        if (route.redirect) {
          return (
            <RouteComponent
              exact
              key={`route-${route.path}`}
              path={route.path}
            >
              <Redirect to={route.redirect}/>
            </RouteComponent>
          );
        }

        return (
          <></>
        );
      })}
    </Switch>
  );
}
