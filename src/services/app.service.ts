import {ipcRenderer} from 'electron';
import {AppSyncMessageHandler} from '../types';

const debug = require('debug')('app:service:app_service');

class AppService {
  sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
    return ipcRenderer.invoke(messageChannel, ...messageArgs);
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
