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
import electronLog from 'electron-log/main';
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
  IPCAsyncMessageHandler,
  IPCCommChannel,
  IPCRendererCommChannel,
  IPCSyncMessageHandler,
} from './modules/ipc';

import {
  PlatformOS,
} from './modules/platform';

import * as AppBuilders from './main/builders';
import * as AppModules from './main/modules';

const sourceMapSupport = require('source-map-support');
const debug = require('debug')('app:main');

function createElectronLogger(name: string, filePath: string) {
  const logger = electronLog.create({ logId: name });
  logger.transports.file.level = 'info';
  logger.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB
  logger.transports.file.format = `[${name}] [{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}`;
  logger.transports.file.resolvePathFn = () => filePath;

  return logger;
}

class App implements IAppMain {
  readonly env?: string;
  readonly debug: boolean;
  readonly prod: boolean;
  readonly version?: string;
  readonly build?: string;
  readonly platform?: string;
  readonly displayName = 'Aurora';
  readonly description = 'A cross-platform music player built with Electron';

  private mainWindow?: BrowserWindow;
  private readonly forceExtensionDownload: boolean;
  private readonly startMinimized?: boolean;
  private readonly resourcesPath: string;
  private readonly enableAutoUpdater = false;
  private readonly htmlFilePath: string;
  private readonly builders: IAppBuilder[] = [];
  private readonly modules: IAppModule[] = [];
  private readonly windowWidth = 1024;
  private readonly windowHeight = 642;
  private readonly windowMinWidth = 1024;
  private readonly windowMinHeight = 642;
  private readonly dataPath: string;
  private isQuitting = false;
  private localProtocols = new Set(['file:', 'app:']);
  private logsDataDir = 'Logs';
  private logsMainFile = 'main.log';
  private logsRendererFile = 'renderer.log';

  constructor() {
    this.env = process.env.NODE_ENV;
    this.debug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
    this.prod = process.env.NODE_ENV === 'production';
    this.version = process.env.APP_VERSION;
    this.build = process.env.BUILD_VERSION;
    this.platform = process.platform;
    this.forceExtensionDownload = !!process.env.UPGRADE_EXTENSIONS;
    this.startMinimized = process.env.START_MINIMIZED === 'true';
    this.resourcesPath = process.resourcesPath;
    this.dataPath = this.debug ? `${this.displayName}-debug` : this.displayName;
    this.htmlFilePath = path.join(__dirname, 'index.html');

    this.configureLogger();
    this.configureApp();
    this.installSourceMapSupport();
    this.installDebugSupport();
    this.registerBuilders();
    this.registerModules();
    this.registerEvents();

    // console.log generally not allowed, but this one is important
    // eslint-disable-next-line no-console
    console.log('[MAIN_INIT] - %o', {
      env: this.env,
      debug: this.debug,
      prod: this.prod,
      version: this.version,
      build: process.env.BUILD_VERSION,
      platform: this.platform,
      chromium: _.get(process, 'versions.chrome'),
      time: new Date().toISOString(),
    });
  }

  quit(): void {
    app.quit();
  }

  registerSyncMessageHandler(messageChannel: string, messageHandler: IPCSyncMessageHandler, messageHandlerCtx?: any): void {
    ipcMain.on(messageChannel, (event, ...args) => {
      debug('ipc (sync) - received message - channel - %s', messageChannel);
      // eslint-disable-next-line no-param-reassign
      event.returnValue = messageHandler.apply(messageHandlerCtx, args);
    });
  }

  registerAsyncMessageHandler(messageChannel: string, messageHandler: IPCAsyncMessageHandler, messageHandlerCtx?: any): void {
    ipcMain.handle(messageChannel, async (_event, ...args) => {
      try {
        debug('ipc (async) - received message - channel - %s', messageChannel);
        return await messageHandler.apply(messageHandlerCtx, args);
      } catch (err: any) {
        console.error(`Encountered error while handling message for - ${messageChannel}, ${args}`);
        console.error(err);
        // electron serializes the error before sending it back to the renderer
        // explicitly send the full shape, set a flag and handle on renderer accordingly
        return { __isError: true, ...err };
      }
    });
  }

  sendMessageToRenderer(messageChannel: string, ...messageArgs: any[]): any {
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
    return path.join(app.getPath('userData'), this.dataPath, ...paths);
  }

  getLogsPath(file?: string) {
    if (file) {
      return this.getDataPath(this.logsDataDir, file);
    }

    return this.getDataPath(this.logsDataDir);
  }

  createDataDir(...paths: string[]): string {
    const dataPath = this.getDataPath(...paths);
    fs.mkdirSync(dataPath, { recursive: true });

    return dataPath;
  }

  getCurrentWindow(): BrowserWindow {
    if (!this.mainWindow) {
      throw new Error('App encountered error at getCurrentWindow - App currently has no current window');
    }

    return this.mainWindow;
  }

  getModule<T>(type: { new(data: any): T }): T {
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
          console.error('encountered error at openPath when opening - %s, error - %s', pathToOpen, errorMessage);
        }
      });
  }

  openLink(linkToOpen: string): void {
    shell
      .openExternal(linkToOpen)
      .then((errorMessage) => {
        if (!_.isEmpty(errorMessage)) {
          console.error('encountered error at openExternal when opening - %s, error - %s', linkToOpen, errorMessage);
        }
      });
  }

  removeAppData() {
    const appDataPath = this.getDataPath();
    this.removeDirectorySafe(appDataPath);
  }

  removePersistedStates() {
    this.sendMessageToRenderer(IPCRendererCommChannel.StateRemovePersisted);
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

  toggleFullScreen() {
    const { mainWindow } = this;
    if (!mainWindow) return;

    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }

  toggleDevTools() {
    const { mainWindow } = this;
    if (!this.debug || !mainWindow) return;

    mainWindow.webContents.toggleDevTools();
  }

  reloadApp() {
    const window = this.getCurrentWindow();
    window.webContents.reload();
  }

  private get iconPath(): string {
    let icon = 'icon.png';

    if (this.platform === PlatformOS.Darwin) {
      icon = 'icon-squircle.png';
    } else if (this.platform === PlatformOS.Windows) {
      icon = 'icon.ico';
    }

    return this.getAssetPath('icons', icon);
  }

  private configureApp(): void {
    app.name = this.displayName;
    app.setName(this.displayName);
    app.setAppUserModelId('com.bbbneo333.aurora');

    app.setAboutPanelOptions({
      applicationName: this.displayName,
      applicationVersion: this.version,
      iconPath: this.iconPath,
    });

    // darwin only
    app.dock?.setIcon(this.iconPath);
  }

  private removeDirectorySafe(directory: string) {
    try {
      fs.rmdirSync(directory, {
        recursive: true,
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.error('removeDatastore - directory does not exists - %s', directory);
      } else {
        throw error;
      }
    }
  }

  private installSourceMapSupport(): void {
    if (!this.prod) {
      return;
    }

    sourceMapSupport.install();
  }

  private configureLogger() {
    if (!this.prod) {
      return;
    }

    this.createDataDir(this.logsDataDir);

    const mainLog = createElectronLogger('main', this.getLogsPath(this.logsMainFile));
    const rendererLog = createElectronLogger('renderer', this.getLogsPath(this.logsRendererFile));

    electronLog.hooks.push((message) => {
      // @ts-ignore
      if (message.variables.processType === 'renderer') {
        rendererLog[message.level](message.data);
        return false; // prevent default logger from handling it
      }

      return message;
    });

    electronLog.initialize();
    Object.assign(console, mainLog.functions);
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
        console.error('encountered error while installing extensions - %s', error);
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
        console.error('autoUpdater.encountered error at checkForUpdatesAndNotify - %s', updateCheckError);
      });
  }

  private async createWindow(): Promise<BrowserWindow> {
    await this.installExtensions();
    const isDarwin = this.platform === PlatformOS.Darwin;

    const mainWindow = new BrowserWindow({
      show: false,
      width: this.windowWidth,
      height: this.windowHeight,
      minWidth: this.windowMinWidth,
      minHeight: this.windowMinHeight,
      icon: this.iconPath,
      titleBarStyle: isDarwin ? 'hiddenInset' : 'hidden',
      ...(!isDarwin ? {
        titleBarOverlay: {
          color: '#1d1d1d', // should match --stage-content-bg-color
          symbolColor: '#e9ecef', // should match --text-light-color
          height: 60, // should match --titlebar-overlay-height
        },
      } : {}),
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
      } else if (this.platform === PlatformOS.Darwin) {
        // on macOS - we keep the renderer process alive but still closing the window
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // when a new browser window is requested
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // if navigating externally, let os handle it
      if (!this.isUrlLocal(url)) {
        debug('openExternal using setWindowOpenHandler - %s', url);
        shell.openExternal(url);

        return { action: 'deny' };
      }

      // if it's internal → let the app handle it
      return { action: 'allow' };
    });

    // when navigating away
    mainWindow.webContents.on('will-navigate', (e, url) => {
      if (!this.isUrlLocal(url)) {
        debug('openExternal using will-navigate - %s', url);

        e.preventDefault();
        shell.openExternal(url);
      }
    });

    // run builders
    this.runBuilders(mainWindow);

    // register handler for auto-updates
    this.registerAutoUpdater();

    // register handlers for renderer messages
    this.registerRendererEvents();

    return mainWindow;
  }

  private registerEvents(): void {
    app.on('window-all-closed', () => {
      // respect the OSX convention of having the application in memory even
      // after all windows have been closed
      if (this.platform !== PlatformOS.Darwin) {
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

  private registerRendererEvents(): void {
    this.registerSyncMessageHandler(IPCCommChannel.AppToggleWindowFill, () => {
      this.toggleWindowFill();
    });

    this.registerSyncMessageHandler(IPCCommChannel.AppResetSettings, () => {
      this.removeAppData();
      this.reloadApp();
    });

    this.registerSyncMessageHandler(IPCCommChannel.AppReadDetails, () => this.getDetails());
  }

  private isUrlLocal(url: string): boolean {
    try {
      const { protocol } = new URL(url);

      return this.localProtocols.has(protocol);
    } catch (err: any) {
      console.error('isNavigatingLocally encountered error - %s', err.message);
      return false;
    }
  }

  private getDetails() {
    return {
      display_name: this.displayName,
      version: this.version,
      build: this.build,
      platform: this.platform,
      logs_path: this.getLogsPath(this.logsRendererFile),
    };
  }
}

export default new App();
