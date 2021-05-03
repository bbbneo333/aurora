import {AppContainer as ReactHotAppContainer} from 'react-hot-loader';
import React, {Fragment} from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import {AppHotComponent} from './app.component';
import rootReducer from './reducers';

import './app.global.css';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => render(
  <Provider store={createStore(rootReducer)}>
    <AppContainer>
      <AppHotComponent/>
    </AppContainer>
  </Provider>,
  document.getElementById('root'),
));
