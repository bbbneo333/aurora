import Debug from 'debug';

import {IMediaProvider} from '../interfaces';
import {EventEmitter} from '../models';
import {MediaEnums} from '../enums';

const debug = Debug('app:service:media_provider_service');

interface IMediaProviderEvents {
  [MediaEnums.MediaProviderUpdateEvent.AddedProvider]: (provider: IMediaProvider) => void;
}

class MediaProviderService extends EventEmitter<IMediaProviderEvents> {
  private readonly mediaProviders: IMediaProvider[] = [];

  addMediaProvider(mediaProvider: IMediaProvider): void {
    debug('adding media provider - %s', mediaProvider.mediaProviderNamespace);
    this.mediaProviders.push(mediaProvider);
    this.emit(MediaEnums.MediaProviderUpdateEvent.AddedProvider, mediaProvider);
  }

  getMediaProvider(mediaProviderNamespace: string): IMediaProvider {
    const mediaProviderRequested = this.mediaProviders.find(mediaProvider => mediaProvider.mediaProviderNamespace === mediaProviderNamespace);
    if (!mediaProviderRequested) {
      throw new Error(`MediaProviderService encountered error at getMediaProvider - Provider could not be resolved - ${mediaProviderNamespace}`);
    }

    return mediaProviderRequested;
  }

  getDefaultMediaProvider(): IMediaProvider {
    const mediaProviderDefault = this.mediaProviders[0];
    if (!mediaProviderDefault) {
      throw new Error('MediaProviderService encountered error at getDefaultMediaProvider - No default media provider found');
    }

    return mediaProviderDefault;
  }
}

export default new MediaProviderService();
