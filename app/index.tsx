import {AppContainer as ReactHotAppContainer} from 'react-hot-loader';
import React, {Fragment} from 'react';
import {render} from 'react-dom';

import './app.global.css';
import {AppHotComponent} from './app.component';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
  return render(
    <AppContainer>
      <AppHotComponent />
    </AppContainer>,
    document.getElementById('root')
  );
});
