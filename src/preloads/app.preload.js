const get = require('lodash/get');
const {contextBridge} = require('electron');

contextBridge.exposeInMainWorld('app', {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 1212,
  versions: {
    chrome: get(process, 'versions.chrome'),
  },
});
