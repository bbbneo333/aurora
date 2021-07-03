import {AppEnums} from '../enums';
import {IMediaTrackData} from '../interfaces';
import AppService from '../services/app.service';

class MediaTrackDatastore {
  private readonly mediaTrackDatastoreName = 'media_tracks';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaTrackDatastoreName);
  }

  findMediaTrackById(mediaTrackId: string): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    });
  }

  findMediaTrackByProvider(mediaTrackProvider: string, mediaTrackProviderId: string): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, {
      provider: mediaTrackProvider,
      provider_id: mediaTrackProviderId,
    });
  }

  insertMediaTrack(mediaTrackData: IMediaTrackData): Promise<IMediaTrackData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaTrackDatastoreName, mediaTrackData);
  }
}

export default new MediaTrackDatastore();
