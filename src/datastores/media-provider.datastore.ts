import { AppEnums } from '../enums';
import { IMediaProviderData } from '../interfaces';
import AppService from '../services/app.service';
import { DataStoreInputData, DataStoreUpdateData } from '../types';

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

  updateMediaProviderByIdentifier(mediaProviderIdentifier: string, mediaProviderUpdateData: DataStoreUpdateData<IMediaProviderData>): Promise<IMediaProviderData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaProviderDatastoreName, {
      identifier: mediaProviderIdentifier,
    }, {
      $set: mediaProviderUpdateData,
    });
  }

  insertMediaProvider(mediaProviderInputData: DataStoreInputData<IMediaProviderData>): Promise<IMediaProviderData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaProviderDatastoreName, mediaProviderInputData);
  }
}

export default new MediaProviderDatastore();
