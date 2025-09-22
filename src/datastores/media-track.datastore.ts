import { IMediaTrackData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IPCService, IPCCommChannel } from '../modules/ipc';

class MediaTrackDatastore {
  private readonly mediaTrackDatastoreName = 'media_tracks';

  constructor() {
    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaTrackDatastoreName, {
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
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }

  findMediaTracks(mediaTrackFilterData?: DataStoreFilterData<IMediaTrackData>): Promise<IMediaTrackData[]> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaTrackDatastoreName, {
      filter: mediaTrackFilterData,
    });
  }

  updateTrackById(mediaTrackId: string, mediaTrackUpdateData: DataStoreUpdateData<IMediaTrackData>): Promise<IMediaTrackData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaTrackDatastoreName, {
      id: mediaTrackId,
    }, {
      $set: mediaTrackUpdateData,
    });
  }

  insertMediaTrack(mediaTrackInputData: DataStoreInputData<IMediaTrackData>): Promise<IMediaTrackData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaTrackDatastoreName, mediaTrackInputData);
  }

  deleteTracks(mediaTrackFilterData: DataStoreFilterData<IMediaTrackData>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemove, this.mediaTrackDatastoreName, mediaTrackFilterData);
  }
}

export default new MediaTrackDatastore();
