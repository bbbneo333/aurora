import {BrowserWindow} from 'electron';

export type AppSyncMessageHandler = (...args: any[]) => {};

export interface IAppMain {
  env?: string;
  platform?: string;
  debug: boolean;

  quit(): void;

  registerSyncMessageHandler(messageChannel: string, messageHandlerSync: AppSyncMessageHandler, messageHandlerCtx?: any): void;

  getAssetPath(...paths: string[]): string;
}

export interface IAppBuilder {
  build(mainWidow: BrowserWindow): void;
}

export interface IAppModule {
}
