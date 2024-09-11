import { AppEnums } from '../enums';
import { IMediaProviderData, IMediaProviderDataUpdateParams } from '../interfaces';
import AppService from '../services/app.service';

class MediaProviderDatastore {
  private readonly mediaProviderDatastoreName = 'media_providers';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaProviderDatastoreName, {
      indexes: [{
        field: 'identifier',
        unique: true,
      }],
    });
  }

  findMediaProviderByIdentifier(mediaProviderIdentifier: string): Promise<IMediaProviderData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaProviderDatastoreName, {
      identifier: mediaProviderIdentifier,
    });
  }

  updateMediaProviderByIdentifier(mediaProviderIdentifier: string, mediaProviderUpdateParams: IMediaProviderDataUpdateParams): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaProviderDatastoreName, {
      identifier: mediaProviderIdentifier,
    }, {
      $set: mediaProviderUpdateParams,
    });
  }

  insertMediaProvider(mediaProviderData: IMediaProviderData): Promise<IMediaProviderData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaProviderDatastoreName, mediaProviderData);
  }
}

export default new MediaProviderDatastore();
