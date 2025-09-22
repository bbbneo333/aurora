import crypto from 'crypto';

import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel } from '../../modules/ipc';

export class CryptoModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerSyncMessageHandler(IPCCommChannel.CryptoGenerateSHA256Hash, this.generateSHA256Hash, this);
  }

  private generateSHA256Hash(data: string): string {
    return crypto.createHash('sha256')
      .update(data)
      .digest()
      .toString('hex');
  }
}
