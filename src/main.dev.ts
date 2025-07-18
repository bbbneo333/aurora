/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 *
 * TODO: Using defaults, following to be looked into before release
 *  - Debug Support
 *  - Auto Update Support
 *  - Logging Support
 *  - Source Map Support
 */

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import path from 'path';
import fs from 'fs';
import electronUpdater from 'electron-updater';
import electronLog from 'electron-log';
import electronDebug from 'electron-debug';
import _ from 'lodash';

import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';

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

import {
  AppEnums,
} from './enums';

import * as AppBuilders from './main/builders';
import * as AppModules from './main/modules';

const sourceMapSupport = require('source-map-support');
const debug = require('debug')('app:main');

class App implements IAppMain {
  readonly env?: string;
  readonly platform?: string;
  readonly debug: boolean;

  private mainWindow?: BrowserWindow;
  private readonly forceExtensionDownload: boolean;
  private readonly startMinimized?: boolean;
  private readonly resourcesPath: string;
  private readonly enableAutoUpdater = false;
  private readonly htmlFilePath = path.join(__dirname, 'index.html');
  private readonly builders: IAppBuilder[] = [];
  private readonly modules: IAppModule[] = [];
  private readonly windowWidth = 1024;
  private readonly windowHeight = 642;
  private readonly windowMinWidth = 1024;
  private readonly windowMinHeight = 642;
  private readonly dataPath: string;
  private isQuitting = false;

  constructor() {
    this.env = process.env.NODE_ENV;
    this.platform = process.platform;
    this.debug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
    this.forceExtensionDownload = !!process.env.UPGRADE_EXTENSIONS;
    this.startMinimized = process.env.START_MINIMIZED === 'true';
    this.resourcesPath = process.resourcesPath;
    this.dataPath = this.debug ? 'Aurora-debug' : 'Aurora';

    this.installSourceMapSupport();
    this.configureLogger();
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

  sendSyncMessageToRenderer(messageChannel: string, ...messageArgs: any[]): any {
    const window = this.getCurrentWindow();
    window.webContents.send(messageChannel, ...messageArgs);
  }

  getAssetPath(...paths: string[]): string {
    const appAssetsPath = app.isPackaged
      ? path.join(this.resourcesPath, 'assets')
      : path.join(__dirname, '../assets');

    return path.join(appAssetsPath, ...paths);
  }

  getDataPath(...paths: string[]): string {
    return path.join(app.getPath('appData'), this.dataPath, ...paths);
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

  removeAppData() {
    const appDataPath = this.getDataPath();
    this.removeDirectorySafe(appDataPath);
  }

  removePersistedStates() {
    this.sendSyncMessageToRenderer(AppEnums.IPCRendererCommChannels.StateRemovePersisted);
  }

  toggleWindowFill() {
    const { mainWindow } = this;
    if (!mainWindow) return;

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }

  private removeDirectorySafe(directory: string) {
    try {
      fs.rmdirSync(directory, {
        recursive: true,
      });
      debug('removeDirectorySafe - directory was removed successfully - %s', directory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        debug('removeDatastore - directory does not exists - %s', directory);
      } else {
        throw error;
      }
    }
  }

  private installSourceMapSupport(): void {
    if (this.env !== 'production') {
      return;
    }

    sourceMapSupport.install();
  }

  private configureLogger() {
    electronLog.transports.file.level = 'info';
  }

  private installDebugSupport(): void {
    if (!this.debug) {
      return;
    }

    electronDebug();
  }

  private async installExtensions(): Promise<void> {
    if (!this.debug) {
      return;
    }

    const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];
    debug('installing extensions - %o', extensions);

    await installExtension(extensions, {
      forceDownload: this.forceExtensionDownload,
      loadExtensionOptions: {
        // for reasons unknown (at least to me) extensions were not working, got them fixed after setting 'allowFileAccess' to 'true'
        // @see (issue) - https://github.com/electron/electron/issues/23662#issuecomment-783805586
        // @see (PR) - https://github.com/electron/electron/pull/25198
        allowFileAccess: true,
      },
    })
      .then(() => {
        debug('extensions were installed successfully');
      })
      .catch((error) => {
        debug('encountered error while installing extensions - %s', error);
      });
  }

  private registerAutoUpdater() {
    if (!this.enableAutoUpdater) {
      return;
    }

    const { autoUpdater } = electronUpdater;

    autoUpdater.logger = electronLog;
    autoUpdater
      .checkForUpdatesAndNotify()
      .then((updateCheckResult) => {
        if (updateCheckResult) {
          debug('autoUpdater.checkForUpdatesAndNotify returned results - %o', updateCheckResult);
        } else {
          debug('autoUpdater.checkForUpdatesAndNotify returned no results');
        }
      })
      .catch((updateCheckError) => {
        debug('autoUpdater.encountered error at checkForUpdatesAndNotify - %s', updateCheckError);
      });
  }

  private async createWindow(): Promise<BrowserWindow> {
    await this.installExtensions();

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
      },
    });

    mainWindow
      .loadURL(`file://${this.htmlFilePath}`)
      .then(() => {
        debug('main window loaded HTML - %s', this.htmlFilePath);
      });

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

    mainWindow.on('close', (event) => {
      // let the app quit if requested by user
      // else simply hide the window, we let the app run in background
      if (this.isQuitting) {
        this.mainWindow = undefined;
      } else {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // TODO: For now we don't support opening up external links,
    //  we are ignoring every external link for now
    // open urls in the user's browser
    // @ts-ignore
    // mainWindow.webContents.on('new-window', (event, url) => {
    //   event.preventDefault();
    //   shell.openExternal(url);
    // });

    // prevent new window on Ctrl+Click or target="_blank"
    mainWindow.webContents.setWindowOpenHandler(() => ({
      action: 'deny',
    }));

    // run builders
    this.runBuilders(mainWindow);

    // register handler for auto-updates
    this.registerAutoUpdater();

    // register handlers for renderer messages
    this.registerSyncMessageHandler(AppEnums.IPCCommChannels.AppToggleWindowFill, () => {
      this.toggleWindowFill();
    });

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

    app.on('before-quit', () => {
      // this apparently called right before when user requests to quit (not close) the app
      this.isQuitting = true;
    });

    app.whenReady()
      .then(async () => {
        this.mainWindow = await this.createWindow();
      })
      .catch(debug);

    app.on('activate', async () => {
      // on macOS, it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open
      if (!this.mainWindow) {
        this.mainWindow = await this.createWindow();
      } else {
        this.mainWindow.show();
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
