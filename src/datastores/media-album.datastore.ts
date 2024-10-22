import { AppEnums } from '../enums';
import { IMediaAlbumData } from '../interfaces';
import AppService from '../services/app.service';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';

class MediaAlbumDatastore {
  private readonly mediaAlbumDatastoreName = 'media_albums';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaAlbumDatastoreName, {
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
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    });
  }

  findMediaAlbum(mediaAlbumFilterData: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }

  findMediaAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<IMediaAlbumData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }

  updateAlbumById(mediaAlbumId: string, mediaAlbumUpdateData: DataStoreUpdateData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    }, {
      $set: mediaAlbumUpdateData,
    });
  }

  insertMediaAlbum(mediaAlbumInputData: DataStoreInputData<IMediaAlbumData>): Promise<IMediaAlbumData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaAlbumDatastoreName, mediaAlbumInputData);
  }

  deleteAlbums(mediaAlbumFilterData?: DataStoreFilterData<IMediaAlbumData>): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaAlbumDatastoreName, mediaAlbumFilterData);
  }
}

export default new MediaAlbumDatastore();
