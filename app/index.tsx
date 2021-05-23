import {AppContainer as ReactHotAppContainer} from 'react-hot-loader';
import React, {Fragment} from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import {AppHotComponent} from './app.component';
import store from './store';

import './app.global.css';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => render(
  <Provider store={store}>
    <AppContainer>
      <AppHotComponent/>
    </AppContainer>
  </Provider>,
  document.getElementById('root'),
));
