import { ipcRenderer, IpcRendererEvent } from 'electron';

import { isIPCErrorObj, deserializeIPCError } from './error';
import { IPCRenderListener } from './types';

const debug = require('debug')('ipc:renderer');

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

  static addMessageHandler(messageChannel: string, messageHandler: (...args: any[]) => void): IPCRenderListener {
    const listener = (_: IpcRendererEvent, ...args: any[]) => {
      debug('ipc - received message - channel - %s', messageChannel);
      messageHandler(...args);
    };

    ipcRenderer.on(messageChannel, listener);
    return listener;
  }

  static removeMessageHandler(messageChannel: string, messageListener: IPCRenderListener): void {
    ipcRenderer.off(messageChannel, messageListener);
  }
}
