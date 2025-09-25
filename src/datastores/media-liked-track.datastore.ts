import { IMediaLikedTrackData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData } from '../types';
import { IPCService, IPCCommChannel } from '../modules/ipc';

class MediaLikedTracksDatastore {
  private readonly datastoreName = 'media_liked_tracks';

  constructor() {
    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.datastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }],
    });
  }

  countLikedTracks(): Promise<number> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSCount, this.datastoreName);
  }

  findLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData | undefined> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.datastoreName, filterData);
  }

  findLikedTracks(filterData?: DataStoreFilterData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData[]> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFind, this.datastoreName, {
      filter: filterData,
    });
  }

  insertLikedTrack(inputData: DataStoreInputData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.datastoreName, inputData);
  }

  deleteLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemove, this.datastoreName, filterData);
  }
}

export default new MediaLikedTracksDatastore();
