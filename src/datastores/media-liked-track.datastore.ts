import { AppEnums } from '../enums';
import { IMediaLikedTrackData } from '../interfaces';
import { DataStoreFilterData, DataStoreInputData } from '../types';

import AppService from '../services/app.service';

class MediaLikedTracksDatastore {
  private readonly datastoreName = 'media_liked_tracks';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.datastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }, {
        field: 'provider_id',
      }],
    });
  }

  findLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.datastoreName, filterData);
  }

  insertLikedTrack(inputData: DataStoreInputData<IMediaLikedTrackData>): Promise<IMediaLikedTrackData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.datastoreName, inputData);
  }

  deleteLikedTrack(filterData: DataStoreFilterData<IMediaLikedTrackData>): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemove, this.datastoreName, filterData);
  }
}

export default new MediaLikedTracksDatastore();
