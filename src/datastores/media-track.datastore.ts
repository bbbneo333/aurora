import { AppEnums } from '../enums';
import { IMediaTrackData, IMediaTrackDataFilterParams, IMediaTrackDataUpdateParams } from '../interfaces';
import AppService from '../services/app.service';

class MediaTrackDatastore {
  private readonly mediaTrackDatastoreName = 'media_tracks';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaTrackDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }, {
        field: 'provider_id',
      }, {
        field: 'track_name',
      }],
    });
  }

  findMediaTrackById(mediaTrackId: string): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    });
  }

  findMediaTrack(mediaTrackFilterParams: IMediaTrackDataFilterParams): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, mediaTrackFilterParams);
  }

  findMediaTracks(mediaTrackFilterParams: IMediaTrackDataFilterParams): Promise<IMediaTrackData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaTrackDatastoreName, mediaTrackFilterParams);
  }

  insertMediaTrack(mediaTrackData: IMediaTrackData): Promise<IMediaTrackData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaTrackDatastoreName, mediaTrackData);
  }

  removeMediaTrackById(mediaTrackId: string): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemoveOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    });
  }

  removeMediaTracks(mediaTrackFilterParams: IMediaTrackDataFilterParams): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaTrackDatastoreName, mediaTrackFilterParams);
  }

  updateMediaTrackById(mediaTrackId: string, mediaTrackUpdateParams: IMediaTrackDataUpdateParams): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    }, {
      $set: mediaTrackUpdateParams,
    });
  }
}

export default new MediaTrackDatastore();
