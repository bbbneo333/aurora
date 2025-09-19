import { AppEnums } from '../enums';
import { IMediaTrackData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCService } from '../modules/ipc';

class MediaTrackDatastore {
  private readonly mediaTrackDatastoreName = 'media_tracks';

  constructor() {
    IPCService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaTrackDatastoreName, {
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
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }

  findMediaTracks(mediaTrackFilterData?: DataStoreFilterData<IMediaTrackData>): Promise<IMediaTrackData[]> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaTrackDatastoreName, {
      filter: mediaTrackFilterData,
    });
  }

  updateTrackById(mediaTrackId: string, mediaTrackUpdateData: DataStoreUpdateData<IMediaTrackData>): Promise<IMediaTrackData> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    }, {
      $set: mediaTrackUpdateData,
    });
  }

  insertMediaTrack(mediaTrackInputData: DataStoreInputData<IMediaTrackData>): Promise<IMediaTrackData> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaTrackDatastoreName, mediaTrackInputData);
  }

  deleteTracks(mediaTrackFilterData: DataStoreFilterData<IMediaTrackData>): Promise<void> {
    return IPCService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }
}

export default new MediaTrackDatastore();
