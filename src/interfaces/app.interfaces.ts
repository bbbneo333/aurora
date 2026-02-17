import { BrowserWindow } from 'electron';

export interface IAppMain {
  readonly env?: string;
  readonly debug: boolean;
  readonly prod: boolean;
  readonly version?: string;
  readonly build?: string;
  readonly platform?: string;
  readonly displayName?: string;
  readonly description: string;

  quit(): void;

  sendMessageToRenderer(messageChannel: string, ...messageArgs: any[]): any;

  getAssetPath(...paths: string[]): string;

  getDataPath(...paths: string[]): string;

  getLogsPath(file?: string): string;

  createDataDir(...paths: string[]): string;

  getCurrentWindow(): BrowserWindow;

  getModule<T>(type: new (data: any) => T): T;

  openPath(path: string): void;

  openLink(link: string): void;

  removeAppData(): void;

  removePersistedStates(): void;

  toggleWindowFill(): void;

  toggleFullScreen(): void;

  toggleDevTools(): void;

  reloadApp(): void;
}

export interface IAppBuilder {
  build(mainWidow: BrowserWindow): void;
}

export interface IAppModule {
}

export interface IAppStatePersistor {
  serialize?: (state: any) => Promise<any>,
  deserialize?: (state: any) => Promise<any>,
  exhaust: (stateExisting: any, stateStored: any) => Promise<any>,
}
