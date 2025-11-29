import { BrowserWindow } from 'electron';

import { IPCAsyncMessageHandler, IPCSyncMessageHandler } from '../modules/ipc';

export interface IAppMain {
  readonly env?: string;
  readonly platform?: string;
  readonly debug: boolean;
  readonly displayName?: string;
  readonly version: string;
  readonly description: string;

  quit(): void;

  registerSyncMessageHandler(messageChannel: string, messageHandlerSync: IPCSyncMessageHandler, messageHandlerCtx?: any): void;

  registerAsyncMessageHandler(messageChannel: string, messageHandler: IPCAsyncMessageHandler, messageHandlerCtx?: any): void;

  sendMessageToRenderer(messageChannel: string, ...messageArgs: any[]): any;

  getAssetPath(...paths: string[]): string;

  getDataPath(...paths: string[]): string;

  createDataDir(...paths: string[]): string;

  getCurrentWindow(): BrowserWindow;

  getModule<T>(type: new (data: any) => T): T;

  openPath(path: string): void;

  removeAppData(): void;

  removePersistedStates(): void;

  toggleWindowFill(): void;

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
