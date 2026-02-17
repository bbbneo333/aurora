import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';

import { SharpModule } from './sharp/module';

export class ImageModule implements IAppModule {
  private readonly sharp: SharpModule;

  constructor(app: IAppMain) {
    this.sharp = new SharpModule(app);

    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    IPCMain.addAsyncMessageHandler(IPCCommChannel.ImageScale, this.sharp.scaleImage, this.sharp);
  }
}
