import { AppEnums } from '../enums';
import { IMediaArtistDataFilterParams, IMediaArtistData } from '../interfaces';
import AppService from '../services/app.service';

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

  findMediaArtist(mediaArtistFilterParams: IMediaArtistDataFilterParams): Promise<IMediaArtistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaArtistDatastoreName, mediaArtistFilterParams);
  }

  insertMediaArtist(mediaArtistData: IMediaArtistData): Promise<IMediaArtistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaArtistDatastoreName, mediaArtistData);
  }
}

export default new MediaArtistDatastore();
