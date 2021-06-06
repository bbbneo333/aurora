import {BrowserWindow} from 'electron';

export interface IAppBuilder {
  build(mainWidow: BrowserWindow): void;
}

export interface IAppMain {
  env?: string;
  platform?: string;
  debug: boolean;

  quit(): void;
}
