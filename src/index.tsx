import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import {AppComponent} from './app.component';
import store from './store';

import './app.global.css';

render(
  <Provider store={store}>
    <AppComponent/>
  </Provider>,
  document.getElementById('root'),
);
