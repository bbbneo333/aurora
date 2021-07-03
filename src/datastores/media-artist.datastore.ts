import {AppEnums} from '../enums';
import {IMediaArtistData} from '../interfaces';
import AppService from '../services/app.service';

class MediaArtistDatastore {
  private readonly mediaArtistDatastoreName = 'media_artists';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaArtistDatastoreName);
  }

  findMediaArtistById(mediaArtistId: string): Promise<IMediaArtistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, {
      id: mediaArtistId,
    });
  }

  findMediaArtistByProvider(mediaArtistProvider: string, mediaArtistProviderId: string): Promise<IMediaArtistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, {
      provider: mediaArtistProvider,
      provider_id: mediaArtistProviderId,
    });
  }

  findMediaArtistByName(mediaArtistProvider: string, mediaArtistName: string): Promise<IMediaArtistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, {
      provider: mediaArtistProvider,
      artist_name: mediaArtistName,
    });
  }

  insertMediaArtist(mediaArtistData: IMediaArtistData): Promise<IMediaArtistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaArtistDatastoreName, mediaArtistData);
  }
}

export default new MediaArtistDatastore();
