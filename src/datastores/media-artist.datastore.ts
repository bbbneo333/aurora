import { IMediaArtistData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

class MediaArtistDatastore {
  private readonly mediaArtistDatastoreName = 'media_artists';

  constructor() {
    IPCRenderer.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaArtistDatastoreName, {
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
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    });
  }

  findMediaArtist(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }

  findMediaArtists(mediaArtistFilterData?: DataStoreFilterData<IMediaArtistData>): Promise<IMediaArtistData[]> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaArtistDatastoreName, {
      filter: mediaArtistFilterData,
    });
  }

  updateArtistById(mediaArtistId: string, mediaArtistUpdateData: DataStoreUpdateData<IMediaArtistData>): Promise<IMediaArtistData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    }, {
      $set: mediaArtistUpdateData,
    });
  }

  insertMediaArtist(mediaArtistInputData: DataStoreInputData<IMediaArtistData>): Promise<IMediaArtistData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaArtistDatastoreName, mediaArtistInputData);
  }

  deleteArtists(mediaArtistFilterData: DataStoreFilterData<IMediaArtistData>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemove, this.mediaArtistDatastoreName, mediaArtistFilterData);
  }
}

export default new MediaArtistDatastore();
