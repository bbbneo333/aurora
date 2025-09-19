import { IMediaProviderData } from '../interfaces';
import { DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCService, IPCCommChannel } from '../modules/ipc';

class MediaProviderDatastore {
  private readonly mediaProviderDatastoreName = 'media_providers';

  constructor() {
    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaProviderDatastoreName, {
      indexes: [{
        field: 'identifier',
        unique: true,
      }],
    });
  }

  findMediaProviderByIdentifier(mediaProviderIdentifier: string): Promise<IMediaProviderData | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaProviderDatastoreName, {
      identifier: mediaProviderIdentifier,
    });
  }

  updateMediaProviderByIdentifier(mediaProviderIdentifier: string, mediaProviderUpdateData: DataStoreUpdateData<IMediaProviderData>): Promise<IMediaProviderData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaProviderDatastoreName, {
      identifier: mediaProviderIdentifier,
    }, {
      $set: mediaProviderUpdateData,
    });
  }

  insertMediaProvider(mediaProviderInputData: DataStoreInputData<IMediaProviderData>): Promise<IMediaProviderData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaProviderDatastoreName, mediaProviderInputData);
  }
}

export default new MediaProviderDatastore();
