import { AppEnums } from '../enums';
import { IMediaArtistData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCService } from '../modules/ipc';

class MediaArtistDatastore {
  private readonly mediaArtistDatastoreName = 'media_artists';

  constructor() {
    IPCService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaArtistDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }, {
        field: 'provider_id',
      }, {
        field: 'artist_name',
      }],
    });
  }

  findMediaArtistById(mediaArtistId: string): Promise<IMediaArtistData | undefined> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    });
  }

  findMediaArtist(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData | undefined> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }

  findMediaArtists(mediaArtistFilterData?: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData[]> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaArtistDatastoreName, {
      filter: mediaArtistFilterData,
    });
  }

  updateArtistById(mediaArtistId: string, mediaArtistUpdateData: DataStoreUpdateData<IMediaArtistData>): Promise<IMediaArtistData> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    }, {
      $set: mediaArtistUpdateData,
    });
  }

  insertMediaArtist(mediaArtistInputData: DataStoreInputData<IMediaArtistData>): Promise<IMediaArtistData> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaArtistDatastoreName, mediaArtistInputData);
  }

  deleteArtists(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<void> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }
}

export default new MediaArtistDatastore();
