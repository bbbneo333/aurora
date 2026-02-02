import { ipcRenderer, IpcRendererEvent } from 'electron';

import { isIPCErrorObj, deserializeIPCError } from './error';
import { IPCListener } from './types';

const debug = require('debug')('app:service:ipc_service');

export class IPCRenderer {
  static sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  static async sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
    const result = await ipcRenderer.invoke(messageChannel, ...messageArgs);

    // custom handling for errors received from main process
    if (isIPCErrorObj(result)) {
      throw deserializeIPCError(result);
    }

    return result;
  }

  static addMessageHandler(messageChannel: string, messageHandler: (...args: any[]) => void): IPCListener {
    const listener = (_: IpcRendererEvent, ...args: any[]) => {
      debug('ipc - received message - channel - %s', messageChannel);
      messageHandler(...args);
    };

    ipcRenderer.on(messageChannel, listener);
    return listener;
  }

  static removeMessageHandler(messageChannel: string, messageListener: IPCListener): void {
    ipcRenderer.off(messageChannel, messageListener);
  }
}
