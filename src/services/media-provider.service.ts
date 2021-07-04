import {MediaEnums} from '../enums';
import {MediaProviderDatastore} from '../datastores';
import {IMediaProvider} from '../interfaces';
import store from '../store';

const debug = require('debug')('app:service:media_provider_service');

class MediaProviderService {
  registerMediaProvider(mediaProvider: IMediaProvider) {
    debug('registerMediaProvider - registering media provider - %s', mediaProvider.mediaProviderIdentifier);

    this.addProviderToDatastore(mediaProvider)
      .then(() => {
        this.addProviderToLocalStore(mediaProvider);

        if (mediaProvider.onMediaProviderRegistered) {
          debug('registerMediaProvider - invoking onMediaProviderRegistered for provider - %s', mediaProvider.mediaProviderIdentifier);
          mediaProvider.onMediaProviderRegistered();
        }

        debug('registerMediaProvider - registered media provider - %s', mediaProvider.mediaProviderIdentifier);
      });
  }

  getMediaProvider(mediaProviderIdentifier: string): IMediaProvider {
    const {mediaProviderRegistry} = store.getState();

    const mediaProviderRequested = mediaProviderRegistry.mediaProviders.find(mediaProvider => mediaProvider.mediaProviderIdentifier === mediaProviderIdentifier);
    if (!mediaProviderRequested) {
      throw new Error(`MediaProviderService encountered error at getMediaProvider - Provider could not be resolved - ${mediaProviderIdentifier}`);
    }

    return mediaProviderRequested;
  }

  async getMediaProviderSettings(mediaProviderIdentifier: string): Promise<any> {
    debug('getMediaProviderSettings - fetching settings for - %s', mediaProviderIdentifier);
    const mediaProviderData = await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProviderIdentifier);
    if (!mediaProviderData) {
      throw new Error(`MediaSettingsManager encountered error at getSettings - Could not find entry for provider - ${mediaProviderIdentifier}`);
    }

    debug('getMediaProviderSettings - fetched settings for - %s, %o', mediaProviderIdentifier, mediaProviderData.settings);
    return mediaProviderData.settings;
  }

  async updateMediaProviderSettings(mediaProviderIdentifier: string, mediaProviderSettings: object): Promise<void> {
    debug('updateMediaProviderSettings - getting existing settings for - %s', mediaProviderIdentifier);
    const mediaProvider = this.getMediaProvider(mediaProviderIdentifier);
    const mediaProviderExistingSettings = await this.getMediaProviderSettings(mediaProviderIdentifier);

    debug('updateMediaProviderSettings - updating settings for - %s, %o', mediaProviderIdentifier, mediaProviderSettings);
    await MediaProviderDatastore.updateMediaProviderByIdentifier(mediaProviderIdentifier, {
      settings: mediaProviderSettings,
    });

    if (mediaProvider.onMediaProviderSettingsUpdated) {
      debug('updateMediaProviderSettings - invoking onMediaProviderSettingsUpdated for provider - %s', mediaProviderIdentifier);
      mediaProvider.onMediaProviderSettingsUpdated(mediaProviderExistingSettings, mediaProviderSettings);
    }

    debug('updateMediaProviderSettings - updated settings - %s', mediaProviderIdentifier);
  }

  private async addProviderToDatastore(mediaProvider: IMediaProvider): Promise<void> {
    // check if we already have an existing entry for the provider in the datastore, do nothing if entry already exists
    if (await MediaProviderDatastore.findMediaProviderByIdentifier(mediaProvider.mediaProviderIdentifier)) {
      return;
    }
    // add entry to the datastore, get default settings
    debug('registerMediaProvider - obtaining default settings for media provider - %s', mediaProvider.mediaProviderIdentifier);
    const mediaProviderDefaultSettings = mediaProvider.mediaSettingsService.getDefaultSettings();
    // add entry for the provider to datastore
    debug('registerMediaProvider - inserting entry for media provider - %s', mediaProvider.mediaProviderIdentifier);
    await MediaProviderDatastore.insertMediaProvider({
      identifier: mediaProvider.mediaProviderIdentifier,
      enabled: true,
      settings: mediaProviderDefaultSettings,
      options: {},
    });
  }

  private addProviderToLocalStore(mediaProvider: IMediaProvider): void {
    store.dispatch({
      type: MediaEnums.MediaProviderRegistryActions.AddProvider,
      data: {
        mediaProvider,
      },
    });
  }
}

export default new MediaProviderService();
