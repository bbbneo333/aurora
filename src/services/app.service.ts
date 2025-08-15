import { ipcRenderer } from 'electron';
import { assign } from 'lodash';

import { AppSyncMessageHandler } from '../types';

const debug = require('debug')('app:service:app_service');

class AppService {
  sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  async sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
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

  registerSyncMessageHandler(messageChannel: string, messageHandler: AppSyncMessageHandler, messageHandlerCtx?: any): void {
    ipcRenderer.on(messageChannel, (event, ...args) => {
      debug('ipc (sync) - received message - channel - %s', messageChannel);
      // eslint-disable-next-line no-param-reassign
      event.returnValue = messageHandler.apply(messageHandlerCtx, args);
    });
  }
}

export default new AppService();
