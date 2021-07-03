import {AppEnums} from '../enums';
import {IMediaAlbumData} from '../interfaces';
import AppService from '../services/app.service';

class MediaAlbumDatastore {
  private readonly mediaAlbumDatastoreName = 'media_albums';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaAlbumDatastoreName);
  }

  findMediaAlbumById(mediaAlbumId: string): Promise<IMediaAlbumData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, {
      id: mediaAlbumId,
    });
  }

  findMediaAlbumByProvider(mediaAlbumProvider: string, mediaAlbumProviderId: string): Promise<IMediaAlbumData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, {
      provider: mediaAlbumProvider,
      provider_id: mediaAlbumProviderId,
    });
  }

  findMediaAlbumByName(mediaAlbumProvider: string, mediaAlbumName: string): Promise<IMediaAlbumData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaAlbumDatastoreName, {
      provider: mediaAlbumProvider,
      album_name: mediaAlbumName,
    });
  }

  insertMediaAlbum(mediaAlbumData: IMediaAlbumData): Promise<IMediaAlbumData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaAlbumDatastoreName, mediaAlbumData);
  }
}

export default new MediaAlbumDatastore();
