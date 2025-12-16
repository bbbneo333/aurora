import { IPCCommChannel, IPCService } from '../modules/ipc';

export type AppDetails = {
  display_name: string;
  version: string;
  build: string;
  logs_path: string;
};

export default class AppService {
  private static Details: AppDetails;

  static getDisplayName(): string {
    return this.getDetail('display_name');
  }

  static getVersion(): string {
    return this.getDetail('version');
  }

  static getBuildVersion() {
    return this.getDetail('build');
  }

  static getLogsPath(): string {
    return this.getDetail('logs_path');
  }

  private static getDetail(key: keyof AppDetails): string {
    if (!this.Details) {
      this.Details = IPCService.sendSyncMessage(IPCCommChannel.AppReadDetails);
    }

    return this.Details[key];
  }
}
