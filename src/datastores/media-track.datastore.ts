import { AppEnums } from '../enums';
import { IMediaTrackData } from '../interfaces';
import AppService from '../services/app.service';
import { DataStoreFilterData, DataStoreInputData } from '../types';

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

  findMediaTrack(mediaTrackFilterData: DataStoreFilterData<IMediaTrackData>): Promise<IMediaTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }

  findMediaTracks(mediaTrackFilterData: DataStoreFilterData<IMediaTrackData>): Promise<IMediaTrackData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }

  insertMediaTrack(mediaTrackInputData: DataStoreInputData<IMediaTrackData>): Promise<IMediaTrackData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaTrackDatastoreName, mediaTrackInputData);
  }
}

export default new MediaTrackDatastore();
