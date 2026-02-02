import path from 'path';
import sharp from 'sharp';

import { ImageFileExtensions } from '../../enums';
import { IAppMain, IAppModule } from '../../interfaces';

import { CryptoService } from '../crypto';
import { IPCCommChannel, IPCMain } from '../ipc';
import { FileSystemUtils } from '../file-system';

import { ImageScaleOptions } from './types';

export class ImageModule implements IAppModule {
  readonly defaultImageExtension = ImageFileExtensions.JPG;
  private readonly app: IAppMain;
  private readonly imagesDataDir = 'Images';

  constructor(app: IAppMain) {
    this.app = app;
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    IPCMain.addAsyncMessageHandler(IPCCommChannel.ImageScale, this.scaleImage, this);
  }

  private async scaleImage(data: Buffer | string, options: ImageScaleOptions): Promise<string> {
    const source = typeof data === 'string' ? data : Buffer.from(data);
    const { width, height } = options;

    const imageCacheDir = this.app.createDataDir(this.imagesDataDir);
    // we use image (path or buffer data) and dimensions as cache key
    const imageCacheKey = CryptoService.sha1(data, `${width}x${height}`);
    const imageCachePath = path.join(imageCacheDir, `${imageCacheKey}.${this.defaultImageExtension}`);

    // if file already exists, return that
    // otherwise create and store new image
    if (FileSystemUtils.isFile(imageCachePath)) {
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
