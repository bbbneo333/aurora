/**
 * This script gets preloaded by Electron main process when building the MainWindow
 * This script has access to node API, therefore this will act as an interface between the public facing components and private node APIs
 *
 * Expoese APIs on window object in order to let public components access it
 */

const {
  contextBridge,
} = require('electron');

contextBridge.exposeInMainWorld('app', {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 1212,
});
