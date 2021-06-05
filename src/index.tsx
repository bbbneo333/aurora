import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter as Router} from 'react-router-dom';

import {AppComponent} from './app.component';
import store from './store';

render(
  <Router>
    <Provider store={store}>
      <AppComponent/>
    </Provider>
  </Router>,
  document.getElementById('root'),
);
