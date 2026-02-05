import electron from 'electron';

import { isIPCErrorObj, deserializeIPCError } from './error';
import { IPCStream } from './stream';
import { IPCRenderListener } from './types';

const debug = require('debug')('aurora:module:ipc:renderer');

export class IPCRenderer {
  static sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return electron.ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  static async sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
    const result = await electron.ipcRenderer.invoke(messageChannel, ...messageArgs);

    // custom handling for errors received from main process
    if (isIPCErrorObj(result)) {
      throw deserializeIPCError(result);
    }

    return result;
  }

  static addMessageHandler(messageChannel: string, messageHandler: (...args: any[]) => void): IPCRenderListener {
    const listener: IPCRenderListener = (_, ...args: any[]) => {
      debug('ipc - received message - channel - %s', messageChannel);
      messageHandler(...args);
    };

    electron.ipcRenderer.on(messageChannel, listener);
    return listener;
  }

  static removeMessageHandler(messageChannel: string, messageListener: IPCRenderListener): void {
    electron.ipcRenderer.off(messageChannel, messageListener);
  }

  static stream<T = never>(
    msgChannel: string,
    msgOptions: any,
    msgDataHandler: (data: T) => void,
    msgErrorHandler?: (err: Error) => void,
    msgCompleteHandler?: () => void,
  ) {
    const eventId = this.sendSyncMessage(msgChannel, msgOptions);
    const channels = IPCStream.composeChannels(msgChannel, eventId);

    const dataListener = this.addMessageHandler(channels.data, msgDataHandler);
    const errorListener = msgErrorHandler && this.addMessageHandler(channels.error, msgErrorHandler);
    const completeListener = this.addMessageHandler(channels.complete, () => {
      this.removeMessageHandler(channels.data, dataListener);
      if (errorListener) this.removeMessageHandler(channels.error, errorListener);
      if (msgCompleteHandler) msgCompleteHandler();

      this.removeMessageHandler(channels.complete, completeListener);
    });
  }
}
