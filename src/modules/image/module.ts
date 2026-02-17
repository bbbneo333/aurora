import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel, IPCMain } from '../ipc';

import { SharpModule } from './sharp/module';
import { VibrantModule } from './vibrant/module';

export class ImageModule implements IAppModule {
  private readonly sharp: SharpModule;
  private readonly vibrant: VibrantModule;

  constructor(app: IAppMain) {
    this.sharp = new SharpModule(app);
    this.vibrant = new VibrantModule();

    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    IPCMain.addAsyncMessageHandler(IPCCommChannel.ImageScale, this.sharp.scaleImage, this.sharp);
    IPCMain.addAsyncMessageHandler(IPCCommChannel.ImageGetColors, this.vibrant.getImageColors, this.vibrant);
  }
}
