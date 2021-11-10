import {ipcRenderer} from 'electron';

class AppService {
  sendSyncMessage(messageChannel: string, ...messageArgs: any[]): any {
    return ipcRenderer.sendSync(messageChannel, ...messageArgs);
  }

  sendAsyncMessage(messageChannel: string, ...messageArgs: any[]): Promise<any> {
    return ipcRenderer.invoke(messageChannel, ...messageArgs);
  }
}

export default new AppService();
