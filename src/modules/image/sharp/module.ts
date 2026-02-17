import path from 'path';
import sharp from 'sharp';

import { IAppMain } from '../../../interfaces';

import { CryptoService } from '../../crypto';
import { FSUtils, FSImageExtension } from '../../file-system';

import { SharpImageScaleOptions } from './types';

export class SharpModule {
  private readonly app: IAppMain;
  private readonly imageExtension = FSImageExtension.JPG;
  private readonly imagesDataDir = 'Images';

  constructor(app: IAppMain) {
    this.app = app;
  }

  async scaleImage(data: Buffer | string, options: SharpImageScaleOptions): Promise<string> {
    const source = typeof data === 'string' ? data : Buffer.from(data);
    const { width, height } = options;

    const imageCacheDir = this.app.createDataDir(this.imagesDataDir);
    // we use image (path or buffer data) and dimensions as cache key
    const imageCacheKey = CryptoService.sha1(data, `${width}x${height}`);
    const imageCachePath = path.join(imageCacheDir, `${imageCacheKey}.${this.imageExtension}`);

    // if file already exists, return that
    // otherwise create and store new image
    if (FSUtils.isFile(imageCachePath)) {
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
