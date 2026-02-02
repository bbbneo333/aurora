import { DataStoreFilterData, DataStoreInputData, DataStoreUpdateData } from '../types';
import { IMediaPlaylistData, IMediaPlaylistTrackData } from '../interfaces';
import { IPCRenderer, IPCCommChannel } from '../modules/ipc';

class MediaPlaylistDatastore {
  private readonly mediaPlaylistsDatastoreName = 'media_playlists';

  constructor() {
    IPCRenderer.sendSyncMessage(IPCCommChannel.DSRegisterDatastore, this.mediaPlaylistsDatastoreName, {
      indexes: [{
        field: 'id',
        unique: true,
      }],
    });
  }

  countMediaPlaylists(): Promise<number> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSCount, this.mediaPlaylistsDatastoreName);
  }

  insertMediaPlaylist(mediaPlaylistInputData: DataStoreInputData<IMediaPlaylistData>): Promise<IMediaPlaylistData> {
    const now = Date.now();

    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSInsertOne, this.mediaPlaylistsDatastoreName, {
      ...mediaPlaylistInputData,
      created_at: now,
      updated_at: now,
    });
  }

  addMediaPlaylistTracks(mediaPlaylistId: string, mediaTrackInputDataList: IMediaPlaylistTrackData[]): Promise<IMediaPlaylistData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $push: {
        tracks: {
          $each: mediaTrackInputDataList,
        },
      },
      $set: {
        updated_at: Date.now(),
      },
    });
  }

  deleteMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackIds: string[]): Promise<IMediaPlaylistData> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $pull: {
        tracks: {
          playlist_track_id: {
            $in: mediaPlaylistTrackIds,
          },
        },
      },
      $set: {
        updated_at: Date.now(),
      },
    });
  }

  findMediaPlaylist(mediaPlaylistFilterData: DataStoreFilterData<IMediaPlaylistData>): Promise<IMediaPlaylistData | undefined> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFindOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  findMediaPlaylists(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<IMediaPlaylistData[]> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSFind, this.mediaPlaylistsDatastoreName, {
      filter: mediaPlaylistFilterData,
    });
  }

  deleteMediaPlaylist(mediaPlaylistFilterData?: DataStoreFilterData<IMediaPlaylistData>): Promise<void> {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSRemoveOne, this.mediaPlaylistsDatastoreName, mediaPlaylistFilterData);
  }

  updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: DataStoreUpdateData<IMediaPlaylistData>) {
    return IPCRenderer.sendAsyncMessage(IPCCommChannel.DSUpdateOne, this.mediaPlaylistsDatastoreName, {
      id: mediaPlaylistId,
    }, {
      $set: {
        ...mediaPlaylistUpdateData,
        updated_at: Date.now(),
      },
    });
  }
}

export default new MediaPlaylistDatastore();
