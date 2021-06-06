import {BrowserWindow} from 'electron';

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

  getAssetPath(...paths: string[]): string;

  getCurrentWindow(): BrowserWindow;
}

export interface IAppBuilder {
  build(mainWidow: BrowserWindow): void;
}

export interface IAppModule {
}
