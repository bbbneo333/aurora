import electron from 'electron';

import { serializeIPCError } from './error';

import {
  IPCAsyncMessageHandler,
  IPCSyncMessageHandler,
  IPCMainSyncListener,
  IPCMainAsyncListener,
} from './types';

const debug = require('debug')('aurora:module:ipc:main');

export class IPCMain {
  static addSyncMessageHandler(messageChannel: string, messageHandler: IPCSyncMessageHandler, messageHandlerCtx?: any): IPCMainSyncListener {
    const listener: IPCMainSyncListener = (event, ...args) => {
      debug('ipc (sync) - received message - channel - %s', messageChannel);
      // eslint-disable-next-line no-param-reassign
      event.returnValue = messageHandler.apply(messageHandlerCtx, args);
    };

    electron.ipcMain.on(messageChannel, listener);
    return listener;
  }

  static addAsyncMessageHandler(messageChannel: string, messageHandler: IPCAsyncMessageHandler, messageHandlerCtx?: any): IPCMainAsyncListener {
    const listener: IPCMainAsyncListener = async (_event, ...args) => {
      try {
        debug('ipc (async) - received message - channel - %s', messageChannel);
        return await messageHandler.apply(messageHandlerCtx, args);
      } catch (err: any) {
        console.error(`Encountered error while handling message for - ${messageChannel}`);
        console.error(err);
        // electron serializes the error before sending it back to the renderer
        // explicitly send the full shape, set a flag and handle on renderer accordingly
        return serializeIPCError(err);
      }
    };

    electron.ipcMain.handle(messageChannel, listener);
    return listener;
  }

  static removeMessageHandler(messageChannel: string, messageListener: IPCSyncMessageHandler | IPCAsyncMessageHandler) {
    electron.ipcMain.off(messageChannel, messageListener);
  }
}
