import path from 'path';
import sharp from 'sharp';

import { ImageFileExtensions } from '../../enums';
import { IAppMain, IAppModule } from '../../interfaces';
import { IPCCommChannel } from '../../modules/ipc';
import { CryptoService } from '../../modules/crypto';
import { isFile } from '../../utils';

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
    const { width, height } = imageScaleOptions;

    const imageCacheDir = this.app.createDataDir(this.imagesDataDir);
    // we use image (path or buffer data) and dimensions as cache key
    const imageCacheKey = CryptoService.sha1(imageData, `${width}x${height}`);
    const imageCachePath = path.join(imageCacheDir, `${imageCacheKey}.${this.defaultImageExtension}`);

    // if file already exists, return that
    // otherwise create and store new image
    if (isFile(imageCachePath)) {
      return imageCachePath;
    }

    await sharp(source)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .toFile(imageCachePath);

    return imageCachePath;
  }
}
