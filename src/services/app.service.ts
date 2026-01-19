import { IPCCommChannel, IPCService } from '../modules/ipc';

export type AppDetails = {
  display_name: string;
  version: string;
  build: string;
  platform: string;
  logs_path: string;
};

export default class AppService {
  private static Details: AppDetails;

  static get details(): AppDetails {
    if (!this.Details) {
      this.Details = IPCService.sendSyncMessage(IPCCommChannel.AppReadDetails);
    }

    return this.Details;
  }
}
