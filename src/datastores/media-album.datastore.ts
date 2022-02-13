import {AppEnums} from '../enums';
import {IMediaAlbumData, IMediaAlbumDataFilterParams} from '../interfaces';
import AppService from '../services/app.service';

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

  findMediaAlbum(mediaAlbumFilterParams: IMediaAlbumDataFilterParams): Promise<IMediaAlbumData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, mediaAlbumFilterParams);
  }

  findMediaAlbums(mediaAlbumFilterParams?: IMediaAlbumDataFilterParams): Promise<IMediaAlbumData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaAlbumDatastoreName, mediaAlbumFilterParams);
  }

  insertMediaAlbum(mediaAlbumData: IMediaAlbumData): Promise<IMediaAlbumData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaAlbumDatastoreName, mediaAlbumData);
  }
}

export default new MediaAlbumDatastore();
