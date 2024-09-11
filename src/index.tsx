import React from 'react';
import { render } from 'react-dom';
import Promise from 'bluebird';

import { AppComponent } from './app.component';

// @ts-ignore
global.Promise = Promise;

render(
  <AppComponent/>,
  document.getElementById('root'),
);
