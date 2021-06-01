import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import {AppComponent} from './app.component';
import store from './store';

render(
  <Provider store={store}>
    <AppComponent/>
  </Provider>,
  document.getElementById('root'),
);
