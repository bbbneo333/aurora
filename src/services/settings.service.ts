import { IPCCommChannel, IPCService } from '../modules/ipc';

export default class SettingsService {
  static resetAppData(): void {
    IPCService.sendSyncMessage(IPCCommChannel.AppSettingsReset);
  }
}
