import React from 'react';
import { createRoot } from 'react-dom/client';
import Promise from 'bluebird';

import './index.global.css';
import { App } from './app/app.component';

// @ts-ignore
global.Promise = Promise;

const container = document.getElementById('root');

const root = createRoot(container!);
root.render(<App/>);
