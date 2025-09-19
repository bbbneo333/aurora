import { IMediaAlbumData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCService, IPCCommChannel } from '../modules/ipc';

class MediaAlbumDatastore {
  private readonly mediaAlbumDatastoreName = 'media_albums';

  constructor() {
    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaAlbumDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }, {
        field: 'provider_id',
      }, {
        field: 'album_name',
      }],
    });
  }

  findMediaAlbumById(mediaAlbumId: string): Promise<IMediaAlbumData | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    });
  }

  findMediaAlbum(mediaAlbumFilterData: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }

  findMediaAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData[]> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaAlbumDatastoreName, {
      filter: mediaAlbumFilterData,
    });
  }

  updateAlbumById(mediaAlbumId: string, mediaAlbumUpdateData: DataStoreUpdateData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    }, {
      $set: mediaAlbumUpdateData,
    });
  }

  insertMediaAlbum(mediaAlbumInputData: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaAlbumDatastoreName, mediaAlbumInputData);
  }

  deleteAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemove, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }
}

export default new MediaAlbumDatastore();
