/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 *
 * TODO: Using defaults, needs to be looked into before release
 */

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import path from 'path';
import {app, BrowserWindow, shell} from 'electron';
import {autoUpdater} from 'electron-updater';
import log from 'electron-log';

import {
  MenuBuilder,
} from './main/builders';

class App {
  private appMainWindow?: BrowserWindow;
  private readonly appEnv?: string;
  private readonly appDebug: boolean;
  private readonly appForceExtensionDownload: boolean;
  private readonly appPlatform?: string;
  private readonly appStartMinimized?: string;
  private readonly appResourcesPath: string;
  private readonly appEnableAutoUpdater = false;
  private readonly appHTMLFilePath = path.join(__dirname, 'index.html');
  private readonly appJSFilePath = path.join(__dirname, 'preloads/index.js');

  constructor() {
    this.appEnv = process.env.NODE_ENV;
    this.appDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
    this.appForceExtensionDownload = !!process.env.UPGRADE_EXTENSIONS;
    this.appPlatform = process.platform;
    this.appStartMinimized = process.env.START_MINIMIZED;
    this.appResourcesPath = process.resourcesPath;

    this.installSourceMapSupport();
    this.installDebugSupport();
    this.registerEvents();
  }

  private installSourceMapSupport(): void {
    if (this.appEnv !== 'production') {
      return;
    }

    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
  }

  private installDebugSupport(): void {
    if (!this.appDebug) {
      return;
    }

    require('electron-debug')();
  }

  private async installExtensions(): Promise<string> {
    const extensionInstaller = require('electron-devtools-installer');
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return extensionInstaller
      .default(extensions.map(name => extensionInstaller[name]), this.appForceExtensionDownload)
      .catch(console.log);
  }

  private getAssetPath(...paths: string[]): string {
    const appAssetsPath = app.isPackaged
      ? path.join(this.appResourcesPath, 'assets')
      : path.join(__dirname, '../assets');

    return path.join(appAssetsPath, ...paths);
  }

  private registerAutoUpdater() {
    if (!this.appEnableAutoUpdater) {
      return;
    }

    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }

  private async createWindow(): Promise<BrowserWindow> {
    if (this.appDebug) {
      await this.installExtensions();
    }

    const mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      icon: this.getAssetPath('icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: true,
        preload: this.appJSFilePath,
      },
    });

    mainWindow.loadURL(`file://${this.appHTMLFilePath}`);

    // @TODO: Use 'ready-to-show' event
    //    https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
      if (!mainWindow) {
        throw new Error('App encountered error at createWindow - "mainWindow" is not defined');
      }

      if (this.appStartMinimized) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('closed', () => {
      this.appMainWindow = undefined;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    // register handler for auto-updates
    this.registerAutoUpdater();

    return mainWindow;
  }

  private registerEvents(): void {
    app.on('window-all-closed', () => {
      // respect the OSX convention of having the application in memory even
      // after all windows have been closed
      if (this.appPlatform !== 'darwin') {
        app.quit();
      }
    });

    app.whenReady()
      .then(async () => {
        this.appMainWindow = await this.createWindow();
      })
      .catch(console.log);

    app.on('activate', async () => {
      // on macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open
      if (!this.appMainWindow) {
        this.appMainWindow = await this.createWindow();
      }
    });
  }
}

export default new App();
