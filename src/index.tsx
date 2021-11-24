import React from 'react';
import {render} from 'react-dom';
import Promise from 'bluebird';
import {Provider} from 'react-redux';
import {BrowserRouter as Router} from 'react-router-dom';

import {AppComponent} from './app.component';
import store from './store';

// @ts-ignore
global.Promise = Promise;

render(
  <Router>
    <Provider store={store}>
      <AppComponent/>
    </Provider>
  </Router>,
  document.getElementById('root'),
);
