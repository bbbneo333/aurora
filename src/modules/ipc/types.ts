import { IpcRendererEvent, IpcMainEvent, IpcMainInvokeEvent } from 'electron';

export type IPCSyncMessageHandler = (...args: any[]) => any;

type MaybePromise<T> = T | PromiseLike<T>;

export type IPCAsyncMessageHandler = (...args: any[]) => MaybePromise<unknown>;

export type IPCRenderListener = (event: IpcRendererEvent, ...args: any[]) => void;

export type IPCMainSyncListener = (event: IpcMainEvent, ...args: any[]) => void;

export type IPCMainAsyncListener = (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>;
