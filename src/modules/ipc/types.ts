import { IpcRendererEvent } from 'electron';

export type IPCSyncMessageHandler = (...args: any[]) => any;

export type IPCAsyncMessageHandler = (...args: any[]) => Promise<any>;

export type IPCListener = (event: IpcRendererEvent, ...args: any[]) => void;
