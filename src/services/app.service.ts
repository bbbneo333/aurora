import { IPCCommChannel, IPCRenderer } from '../modules/ipc';

export type AppDetails = {
  display_name: string;
  version: string;
  build: string;
  platform: string;
  logs_path: string;
};

export class AppService {
  private static Details: AppDetails;

  static get details(): AppDetails {
    if (!this.Details) {
      this.Details = IPCRenderer.sendSyncMessage(IPCCommChannel.AppReadDetails);
    }

    return this.Details;
  }

  static resetAppData(): void {
    IPCRenderer.sendSyncMessage(IPCCommChannel.AppResetSettings);
  }
}
