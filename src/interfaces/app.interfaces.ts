import { BrowserWindow } from 'electron';

import {
  AppAsyncMessageHandler,
  AppSyncMessageHandler,
} from '../types';

export interface IAppMain {
  env?: string;
  platform?: string;
  debug: boolean;

  quit(): void;

  registerSyncMessageHandler(messageChannel: string, messageHandlerSync: AppSyncMessageHandler, messageHandlerCtx?: any): void;

  registerAsyncMessageHandler(messageChannel: string, messageHandler: AppAsyncMessageHandler, messageHandlerCtx?: any): void;

  sendSyncMessageToRenderer(messageChannel: string, ...messageArgs: any[]): any;

  getAssetPath(...paths: string[]): string;

  getDataPath(...paths: string[]): string;

  getCurrentWindow(): BrowserWindow;

  getModule<T>(type: new (data: any) => T): T;

  openPath(path: string): void;

  removeAppData(): void;

  removePersistedStates(): void;

  toggleWindowFill(): void;
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
