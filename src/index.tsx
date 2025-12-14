import React from 'react';
import { createRoot } from 'react-dom/client';
import Promise from 'bluebird';
import log from 'electron-log/renderer';

import './index.global.css';
import { App } from './app/app.component';

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
const isProd = process.env.NODE_ENV === 'production';

// @ts-ignore
global.Promise = Promise;

// configure logging for prod
if (isProd) {
  Object.assign(console, log.functions);
}

const container = document.getElementById('root');

const root = createRoot(container!);
root.render(<App/>);

// console.log generally not allowed, but this one is important
// eslint-disable-next-line no-console
console.log('[RENDERER_INIT] - %o', {
  env: process.env.NODE_ENV,
  debug: isDebug,
  prod: isProd,
  version: process.env.APP_VERSION,
  build: process.env.BUILD_VERSION,
  platform: navigator.platform,
  time: new Date().toISOString(),
});
