import path from 'path';
import sharp from 'sharp';

import { ImageFileExtensions } from '../../enums';
import { IAppMain, IAppModule } from '../../interfaces';
import { StringUtils } from '../../utils';
import { IPCCommChannel } from '../../modules/ipc';

export class MediaModule implements IAppModule {
  readonly defaultImageExtension = ImageFileExtensions.JPG;
  private readonly app: IAppMain;
  private readonly imagesDataDir = 'Images';

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    this.app.registerAsyncMessageHandler(IPCCommChannel.MediaScaleAndCacheImage, this.scaleAndCacheImage, this);
  }

  private async scaleAndCacheImage(imageData: Buffer | string, imageScaleOptions: {
    width: number,
    height: number,
  }): Promise<string> {
    const source = typeof imageData === 'string' ? imageData : Buffer.from(imageData);
    const imageCacheDir = this.app.createDataDir(this.imagesDataDir);
    const imageCachePath = path.join(imageCacheDir, `${StringUtils.generateId()}.${this.defaultImageExtension}`);

    await sharp(source)
      .resize(imageScaleOptions.width, imageScaleOptions.height, {
        fit: 'cover',
        position: 'center',
      })
      .toFile(imageCachePath);

    return imageCachePath;
  }
}
