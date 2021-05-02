import {AppContainer as ReactHotAppContainer} from 'react-hot-loader';
import React, {Fragment} from 'react';
import {render} from 'react-dom';

import {AppHotComponent} from './app.component';

import './app.global.css';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => render(
  <AppContainer>
    <AppHotComponent/>
  </AppContainer>,
  document.getElementById('root'),
));
