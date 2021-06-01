/**
 * This is where all the preloads are loaded
 * Preloads act as a interface between the renderer and main process via help of ContextBridge API provided by electron
 * This file gets imported by main process and preloads are then made available to the renderer process
 */

require('./app.preload');
