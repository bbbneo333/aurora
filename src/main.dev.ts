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
import {autoUpdater} from 'electron-updater';
import log from 'electron-log';
import * as _ from 'lodash';

import {
  app,
  ipcMain,
  shell,
  BrowserWindow,
} from 'electron';

import {
  IAppMain,
  IAppBuilder,
  IAppModule,
} from './interfaces';

import {
  AppSyncMessageHandler,
  AppAsyncMessageHandler,
} from './types';

import * as AppBuilders from './main/builders';
import * as AppModules from './main/modules';

const debug = require('debug')('app:main');

class App implements IAppMain {
  readonly env?: string;
  readonly platform?: string;
  readonly debug: boolean;

  private mainWindow?: BrowserWindow;
  private readonly forceExtensionDownload: boolean;
  private readonly startMinimized?: string;
  private readonly resourcesPath: string;
  private readonly enableAutoUpdater = false;
  private readonly htmlFilePath = path.join(__dirname, 'index.html');
  private readonly builders: IAppBuilder[] = [];
  private readonly modules: IAppModule[] = [];
  private readonly windowWidth = 1024;
  private readonly windowHeight = 780;
  private readonly windowMinWidth = 1024;
  private readonly windowMinHeight = 620;

  constructor() {
    this.env = process.env.NODE_ENV;
    this.platform = process.platform;
    this.debug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
    this.forceExtensionDownload = !!process.env.UPGRADE_EXTENSIONS;
    this.startMinimized = process.env.START_MINIMIZED;
    this.resourcesPath = process.resourcesPath;

    this.installSourceMapSupport();
    this.installDebugSupport();
    this.registerBuilders();
    this.registerModules();
    this.registerEvents();

    debug('app instantiated - %o', {
      env: this.env,
      platform: this.platform,
      debug: this.debug,
      chromiumVersion: _.get(process, 'versions.chrome'),
    });
  }

  quit(): void {
    app.quit();
  }

  registerSyncMessageHandler(messageChannel: string, messageHandler: AppSyncMessageHandler, messageHandlerCtx?: any): void {
    ipcMain.on(messageChannel, (event, ...args) => {
      debug('ipc (sync) - received message - channel - %s', messageChannel);
      // eslint-disable-next-line no-param-reassign
      event.returnValue = messageHandler.apply(messageHandlerCtx, args);
    });
  }

  registerAsyncMessageHandler(messageChannel: string, messageHandler: AppAsyncMessageHandler, messageHandlerCtx?: any): void {
    ipcMain.handle(messageChannel, (_event, ...args) => {
      debug('ipc (async) - received message - channel - %s', messageChannel);
      return messageHandler.apply(messageHandlerCtx, args);
    });
  }

  getAssetPath(...paths: string[]): string {
    const appAssetsPath = app.isPackaged
      ? path.join(this.resourcesPath, 'assets')
      : path.join(__dirname, '../assets');

    return path.join(appAssetsPath, ...paths);
  }

  getDataPath(...paths: string[]): string {
    return path.join(app.getPath('appData'), 'Aurora', ...paths);
  }

  getCurrentWindow(): BrowserWindow {
    if (!this.mainWindow) {
      throw new Error('App encountered error at getCurrentWindow - App currently has no current window');
    }

    return this.mainWindow;
  }

  getModule<T>(type: {
    new(data: any): T,
  }): T {
    const module = this.modules.find(m => m instanceof type);
    if (!module) {
      throw new Error(`App encountered error at getModule - Module not found - ${type.name}`);
    }

    return module as T;
  }

  openPath(pathToOpen: string): void {
    shell
      .openPath(pathToOpen)
      .then((errorMessage) => {
        // returns Promise<String
        // resolves with a string containing the error message corresponding to
        // the failure if a failure occurred, otherwise ""
        // @see - https://www.electronjs.org/docs/latest/api/shell
        if (!_.isEmpty(errorMessage)) {
          debug('encountered error at openPath when opening - %s, error - %s', pathToOpen, errorMessage);
        }
      });
  }

  private installSourceMapSupport(): void {
    if (this.env !== 'production') {
      return;
    }

    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
  }

  private installDebugSupport(): void {
    if (!this.debug) {
      return;
    }

    require('electron-debug')();
  }

  private async installExtensions(): Promise<string> {
    const extensionInstaller = require('electron-devtools-installer');
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return extensionInstaller
      .default(extensions.map(name => extensionInstaller[name]), this.forceExtensionDownload)
      .catch(console.log);
  }

  private registerAutoUpdater() {
    if (!this.enableAutoUpdater) {
      return;
    }

    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }

  private async createWindow(): Promise<BrowserWindow> {
    if (this.debug) {
      await this.installExtensions();
    }

    const mainWindow = new BrowserWindow({
      show: false,
      width: this.windowWidth,
      height: this.windowHeight,
      minWidth: this.windowMinWidth,
      minHeight: this.windowMinHeight,
      icon: this.getAssetPath('icon.png'),
      titleBarStyle: 'hiddenInset',
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: false,
      },
    });

    mainWindow.loadURL(`file://${this.htmlFilePath}`);

    // @TODO: Use 'ready-to-show' event
    //    https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
      if (!mainWindow) {
        throw new Error('App encountered error at createWindow - "mainWindow" is not defined');
      }

      if (this.startMinimized) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.on('closed', () => {
      this.mainWindow = undefined;
    });

    // open urls in the user's browser
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    // run builders
    this.runBuilders(mainWindow);

    // register handler for auto-updates
    this.registerAutoUpdater();

    return mainWindow;
  }

  private registerEvents(): void {
    app.on('window-all-closed', () => {
      // respect the OSX convention of having the application in memory even
      // after all windows have been closed
      if (this.platform !== 'darwin') {
        app.quit();
      }
    });

    app.whenReady()
      .then(async () => {
        this.mainWindow = await this.createWindow();
      })
      .catch(console.log);

    app.on('activate', async () => {
      // on macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open
      if (!this.mainWindow) {
        this.mainWindow = await this.createWindow();
      }
    });
  }

  private registerBuilders(): void {
    const builders = _.map(AppBuilders, AppBuilder => new AppBuilder(this));
    debug('registering builders - %o', _.map(builders, builder => builder.constructor.name));
    this.builders.push(...builders);
  }

  private registerModules(): void {
    const modules = _.map(AppModules, AppModule => new AppModule(this));
    debug('registering modules - %o', _.map(modules, module => module.constructor.name));
    this.modules.push(...modules);
  }

  private runBuilders(mainWindow: BrowserWindow): void {
    this.builders.forEach((builder) => {
      builder.build(mainWindow);
    });
  }
}

export default new App();
