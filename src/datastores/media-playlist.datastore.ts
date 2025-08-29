import AppService from '../services/app.service';
import { AppEnums } from '../enums';
import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';

import {
  IMediaPlaylistData,
  IMediaPlaylistTrackData,
} from '../interfaces';

class MediaPlaylistDatastore {
  private readonly mediaPlaylistsDatastoreName = 'media_playlists';

  constructor() {
    AppService.sendSyncMessage(AppEnums.IPCCommChannels.DSRegisterDatastore, this.mediaPlaylistsDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }],
    });
  }

  countMediaPlaylists(): Promise<number> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSCount, this.mediaPlaylistsDatastoreName);
  }

  insertMediaPlaylist(mediaPlaylistInputData: DataStoreInputData<IMediaPlaylistData>): Promise<IMediaPlaylistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSInsertOne, this.mediaPlaylistsDatastoreName, mediaPlaylistInputData);
  }

  createMediaPlaylistTracks(mediaPlaylistId: string, mediaTrackInputDataList: IMediaPlaylistTrackData[]): Promise<IMediaPlaylistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $push: {
        tracks: {
          $each: mediaTrackInputDataList,
        },
      },
    });
  }

  deleteMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackIds: string[]): Promise<IMediaPlaylistData> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $pull: {
        tracks: {
          playlist_track_id: {
            $in: mediaPlaylistTrackIds,
          },
        },
      },
    });
  }

  findMediaPlaylist(mediaPlaylistFilterData: DataStoreFilterData<IMediaPlaylistData>): Promise<IMediaPlaylistData | undefined> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFindOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  findMediaPlaylists(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<IMediaPlaylistData[]> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSFind, this.mediaPlaylistsDatastoreName, {
      filter: mediaPlaylistFilterData,
    });
  }

  deleteMediaPlaylist(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<void> {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSRemoveOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: DataStoreUpdateData<IMediaPlaylistData>) {
    return AppService.sendAsyncMessage(AppEnums.IPCCommChannels.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $set: mediaPlaylistUpdateData,
    });
  }
}

export default new MediaPlaylistDatastore();
