import { IpcRendererEvent, IpcMainEvent, IpcMainInvokeEvent } from 'electron';

export type IPCSyncMessageHandler = (...args: any[]) => any;

export type IPCAsyncMessageHandler = (...args: any[]) => Promise<any>;

export type IPCRenderListener = (event: IpcRendererEvent, ...args: any[]) => void;

export type IPCMainSyncListener = (event: IpcMainEvent, ...args: any[]) => void;

export type IPCMainAsyncListener = (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>;
