import { IMediaLikedTrackData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData } from '../modules/datastore';
import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

class MediaLikedTracksDatastore {
  private readonly datastoreName = 'media_liked_tracks';

  constructor() {
    IPCRenderer.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.datastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }],
    });
  }

  countLikedTracks(): Promise<number> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSCount, this.datastoreName);
  }

  findLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.datastoreName, filterData);
  }

  findLikedTracks(filterData?: DataStoreFilterData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData[]> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFind, this.datastoreName, {
      filter: filterData,
    });
  }

  insertLikedTrack(inputData: DataStoreInputData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.datastoreName, inputData);
  }

  deleteLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemove, this.datastoreName, filterData);
  }
}

export default new MediaLikedTracksDatastore();
