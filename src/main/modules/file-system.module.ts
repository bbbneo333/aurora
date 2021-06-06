import fs from 'fs';

import {AppEnums} from '../../enums';
import {IAppMain, IAppModule} from '../../interfaces';

export class FileSystemModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerSyncMessageHandler(AppEnums.IPCCommChannels.FSReadAsset, this.readAsset, this);
  }

  private readAsset(assetPath: string[], assetReadOptions: {
    encoding?: 'utf8',
  } = {}) {
    const assetResourcePath = this.app.getAssetPath(...assetPath);
    return fs.readFileSync(assetResourcePath, assetReadOptions.encoding);
  }
}
