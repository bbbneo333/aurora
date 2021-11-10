import Jimp from 'jimp';

import {AppEnums} from '../../enums';
import {IAppMain, IAppModule} from '../../interfaces';
import {StringUtils} from '../../utils';

export class MediaModule implements IAppModule {
  private readonly app: IAppMain;

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerAsyncMessageHandler(AppEnums.IPCCommChannels.MediaScaleAndCacheImage, this.scaleAndCacheImage, this);
  }

  private async scaleAndCacheImage(imageData: Buffer, imageScaleOptions: {
    width: number,
    height: number,
  }): Promise<string> {
    // for usage see - https://www.npmjs.com/package/jimp#basic-usage
    // this will scale the image to the given width and height, some parts of the image may be letter boxed
    const image = await Jimp.read(Buffer.from(imageData));
    image.cover(imageScaleOptions.width, imageScaleOptions.height);

    const imageCachePath = this.app.getDataPath('cache', 'images', StringUtils.generateId());
    await image.writeAsync(imageCachePath);

    return imageCachePath;
  }
}
