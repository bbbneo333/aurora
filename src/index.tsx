import React from 'react';
import { render } from 'react-dom';
import Promise from 'bluebird';

import './index.global.css';
import { App } from './app/app.component';

// @ts-ignore
global.Promise = Promise;

render(
  <App/>,
  document.getElementById('root'),
);
