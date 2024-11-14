import { AppEnums } from '../enums';
import { IMediaArtistData } from '../interfaces';
import AppService from '../services/app.service';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';

class MediaArtistDatastore {
  private readonly mediaArtistDatastoreName = 'media_artists';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaArtistDatastoreName, {
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
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    });
  }

  findMediaArtist(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }

  findMediaArtists(mediaArtistFilterData?: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaArtistDatastoreName, {
      filter: mediaArtistFilterData,
    });
  }

  updateArtistById(mediaArtistId: string, mediaArtistUpdateData: DataStoreUpdateData<IMediaArtistData>): Promise<IMediaArtistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    }, {
      $set: mediaArtistUpdateData,
    });
  }

  insertMediaArtist(mediaArtistInputData: DataStoreInputData<IMediaArtistData>): Promise<IMediaArtistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaArtistDatastoreName, mediaArtistInputData);
  }

  deleteArtists(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }
}

export default new MediaArtistDatastore();
