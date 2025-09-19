import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IMediaPlaylistData, IMediaPlaylistTrackData } from '../interfaces';
import { IPCService, IPCCommChannel } from '../modules/ipc';

class MediaPlaylistDatastore {
  private readonly mediaPlaylistsDatastoreName = 'media_playlists';

  constructor() {
    IPCService.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaPlaylistsDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }],
    });
  }

  countMediaPlaylists(): Promise<number> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSCount, this.mediaPlaylistsDatastoreName);
  }

  insertMediaPlaylist(mediaPlaylistInputData: DataStoreInputData<IMediaPlaylistData>): Promise<IMediaPlaylistData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaPlaylistsDatastoreName, mediaPlaylistInputData);
  }

  addMediaPlaylistTracks(mediaPlaylistId: string, mediaTrackInputDataList: IMediaPlaylistTrackData[]): Promise<IMediaPlaylistData> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
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
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
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
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  findMediaPlaylists(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<IMediaPlaylistData[]> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaPlaylistsDatastoreName, {
      filter: mediaPlaylistFilterData,
    });
  }

  deleteMediaPlaylist(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<void> {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSRemoveOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: DataStoreUpdateData<IMediaPlaylistData>) {
    return IPCService.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $set: mediaPlaylistUpdateData,
    });
  }
}

export default new MediaPlaylistDatastore();
