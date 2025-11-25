import { IPCCommChannel, IPCService } from '../modules/ipc';

export type AppDetails = {
  display_name: string;
  version: string;
};

export default class AppService {
  private static Details: AppDetails;

  static getDisplayName(): string {
    return this.getDetail('display_name');
  }

  static getVersion(): string {
    return this.getDetail('version');
  }

  private static getDetail(key: keyof AppDetails): string {
    if (!this.Details) {
      this.Details = IPCService.sendSyncMessage(IPCCommChannel.AppReadDetails);
    }

    return this.Details[key];
  }
}
