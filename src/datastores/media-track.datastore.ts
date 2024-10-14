import { AppEnums } from '../enums';
import { IMediaTrackData } from '../interfaces';

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

  findMediaTrack(mediaTrackFilterParams: any): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, mediaTrackFilterParams);
  }

  findMediaTracks(mediaTrackFilterParams: any): Promise<IMediaTrackData[]> {
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

  removeMediaTracks(mediaTrackFilterParams: any): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaTrackDatastoreName, mediaTrackFilterParams);
  }

  updateMediaTrackById(mediaTrackId: string, mediaTrackUpdateParams: any): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    }, {
      $set: mediaTrackUpdateParams,
    });
  }
}

export default new MediaTrackDatastore();
