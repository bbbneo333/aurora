import { ipcRenderer } from 'electron';
import { assign, set } from 'lodash';

const debug = require('debug')('app:service:ipc_service');

export class IPCService {
  static sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  static async sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
    const result = await ipcRenderer.invoke(messageChannel, ...messageArgs);

    // custom handling for errors received from main process
    // eslint-disable-next-line no-underscore-dangle
    if (result?.__isError) {
      const error = new Error(result.message);
      assign(error, result);
      throw error;
    }

    return result;
  }

  static registerSyncMessageHandler(messageChannel: string, messageHandler: any, messageHandlerCtx?: any): void {
    ipcRenderer.on(messageChannel, (event, ...args) => {
      debug('ipc (sync) - received message - channel - %s', messageChannel);
      set(event, 'returnValue', messageHandler.apply(messageHandlerCtx, args));
    });
  }
}
