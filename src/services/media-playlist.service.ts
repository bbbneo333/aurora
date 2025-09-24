import _ from 'lodash';

import {
  IMediaPlaylist,
  IMediaPlaylistData,
  IMediaPlaylistInputData,
  IMediaPlaylistTrack,
  IMediaPlaylistTrackData,
  IMediaPlaylistTrackInputData,
  IMediaPlaylistTrackUpdateData,
  IMediaPlaylistUpdateData,
} from '../interfaces';

import { MediaPlaylistDatastore } from '../datastores';
import { DatastoreUtils, MediaUtils } from '../utils';
import store from '../store';
import { MediaLibraryActions } from '../enums';

import {
  BaseError,
  DataStoreInputData,
  DataStoreUpdateData,
  EntityNotFoundError,
} from '../types';

import NotificationService from './notification.service';
import I18nService from './i18n.service';
import MediaLibraryService from './media-library.service';

export class MediaLibraryPlaylistDuplicateTracksError extends BaseError {
  existingTrackDataList: IMediaPlaylistTrackInputData[] = [];
  newTrackDataList: IMediaPlaylistTrackInputData[] = [];

  constructor(
    existingTrackDataList: IMediaPlaylistTrackInputData[],
    newTrackDataList: IMediaPlaylistTrackInputData[] = [],
  ) {
    super('Duplicate tracks found in playlist');
    this.name = 'MediaLibraryPlaylistDuplicateTracksError';
    this.existingTrackDataList = existingTrackDataList;
    this.newTrackDataList = newTrackDataList;
  }
}

class MediaPlaylistService {
  readonly removeOnMissing = false;

  loadMediaPlaylists(): void {
    this
      .getMediaPlaylists()
      .then((mediaPlaylists) => {
        store.dispatch({
          type: MediaLibraryActions.SetPlaylists,
          data: {
            mediaPlaylists,
          },
        });
      });
  }

  loadMediaPlaylist(mediaPlaylistId: string): void {
    this
      .getMediaPlaylist(mediaPlaylistId)
      .then((mediaPlaylist) => {
        store.dispatch({
          type: MediaLibraryActions.SetPlaylist,
          data: {
            mediaPlaylist,
          },
        });
      });
  }

  async searchPlaylistsByName(query: string): Promise<IMediaPlaylist[]> {
    const playlists = await MediaPlaylistDatastore.findMediaPlaylists({
      name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaPlaylists(playlists);
  }

  async getMediaPlaylist(mediaPlaylistId: string): Promise<IMediaPlaylist | undefined> {
    const mediaPlaylistData = await MediaPlaylistDatastore.findMediaPlaylist({
      id: mediaPlaylistId,
    });

    return mediaPlaylistData ? this.buildMediaPlaylist(mediaPlaylistData) : undefined;
  }

  async resolveMediaPlaylistTracks(mediaPlaylistId: string): Promise<IMediaPlaylistTrack[]> {
    // this function fetches playlist tracks along with the linked media track
    // in case media track is not found, it removes the playlist track entry (if enabled)
    const playlist = await this.getMediaPlaylist(mediaPlaylistId);
    if (!playlist) {
      throw new Error(`MediaLibraryService encountered error at getMediaPlaylistTracks - Playlist not found - ${mediaPlaylistId}`);
    }
    const playlistTracks: IMediaPlaylistTrack[] = [];
    const playlistTrackIdsMissing: string[] = [];

    await Promise.map(playlist.tracks, async (data) => {
      try {
        const track = await this.buildMediaPlaylistTrack(data);
        playlistTracks.push(track);
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          console.warn(error);
          playlistTrackIdsMissing.push(data.playlist_track_id);
        }
      }
    });

    if (!_.isEmpty(playlistTrackIdsMissing) && this.removeOnMissing) {
      await this.deleteMediaPlaylistTracks(mediaPlaylistId, playlistTrackIdsMissing);
    }

    return playlistTracks;
  }

  async getMediaPlaylists(): Promise<IMediaPlaylist[]> {
    const mediaPlaylistsDataList = await MediaPlaylistDatastore.findMediaPlaylists();

    const mediaPlaylists = await Promise.all(
      mediaPlaylistsDataList.map(mediaPlaylistData => this.buildMediaPlaylist(mediaPlaylistData)),
    );

    return MediaUtils.sortMediaPlaylists(mediaPlaylists);
  }

  async createMediaPlaylist(mediaPlaylistInputData?: IMediaPlaylistInputData): Promise<IMediaPlaylist> {
    const inputData: DataStoreInputData<IMediaPlaylistData> = _.defaults(mediaPlaylistInputData, {
      name: await this.getDefaultNewPlaylistName(),
      tracks: [],
      created_at: Date.now(),
    });
    inputData.tracks = inputData.tracks.map(trackInputData => this.buildMediaPlaylistTrackFromInput(trackInputData));

    const mediaPlaylistData = await MediaPlaylistDatastore.insertMediaPlaylist(inputData);
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  /**
   * @throws MediaLibraryPlaylistDuplicateTracksError
   */
  async addMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[], options?: {
    ignoreExisting?: boolean; // only add new ones
  }): Promise<IMediaPlaylist> {
    const {
      existingInputDataList,
      newInputDataList,
    } = await this.getExistingMediaPlaylistTrackInputData(
      mediaPlaylistId,
      mediaPlaylistTrackInputDataList,
    );

    if (!_.isEmpty(existingInputDataList) && !options?.ignoreExisting) {
      // not allowed to add duplicate tracks, throw error
      throw new MediaLibraryPlaylistDuplicateTracksError(existingInputDataList, newInputDataList);
    }

    // all good
    const mediaPlaylistData = await MediaPlaylistDatastore.addMediaPlaylistTracks(
      mediaPlaylistId,
      mediaPlaylistTrackInputDataList.map(trackInputData => this.buildMediaPlaylistTrackFromInput(trackInputData)),
    );

    const mediaPlaylistUpdated = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist: mediaPlaylistUpdated,
      },
    });

    NotificationService.showMessage(I18nService.getString('message_added_to_playlist', {
      playlistName: mediaPlaylistUpdated.name,
    }));

    return mediaPlaylistUpdated;
  }

  async updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: IMediaPlaylistUpdateData): Promise<IMediaPlaylist> {
    const mediaPlaylistData = await MediaPlaylistDatastore.updateMediaPlaylist(mediaPlaylistId, await this.buildMediaPlaylistUpdateDataFromInput(mediaPlaylistId, mediaPlaylistUpdateData));
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  async deleteMediaPlaylist(mediaPlaylistId: string): Promise<void> {
    await MediaPlaylistDatastore.deleteMediaPlaylist({
      id: mediaPlaylistId,
    });

    store.dispatch({
      type: MediaLibraryActions.RemovePlaylist,
      data: {
        mediaPlaylistId,
      },
    });

    NotificationService.showMessage(I18nService.getString('message_playlist_deleted'));
  }

  async deleteMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackIds: string[]): Promise<IMediaPlaylist> {
    const mediaPlaylistData = await MediaPlaylistDatastore.deleteMediaPlaylistTracks(mediaPlaylistId, mediaPlaylistTrackIds);
    const mediaPlaylist = await this.buildMediaPlaylist(mediaPlaylistData);

    store.dispatch({
      type: MediaLibraryActions.AddPlaylist,
      data: {
        mediaPlaylist,
      },
    });

    return mediaPlaylist;
  }

  private async buildMediaPlaylist(mediaPlaylistData: IMediaPlaylistData) {
    return _.assign(mediaPlaylistData, {});
  }

  private async buildMediaPlaylists(mediaPlaylistDataList: IMediaPlaylistData[]) {
    return Promise.all(mediaPlaylistDataList.map((mediaPlaylistData: any) => this.buildMediaPlaylist(mediaPlaylistData)));
  }

  private async buildMediaPlaylistTrack(mediaPlaylistTrackData: IMediaPlaylistTrackData): Promise<IMediaPlaylistTrack> {
    const mediaTrack = await MediaLibraryService.getMediaTrackForProvider(mediaPlaylistTrackData.provider, mediaPlaylistTrackData.provider_id);
    if (!mediaTrack) {
      throw new EntityNotFoundError(`${mediaPlaylistTrackData.provider}-${mediaPlaylistTrackData.provider_id}`, 'track');
    }

    return {
      ...mediaTrack,
      ...mediaPlaylistTrackData,
    };
  }

  private async getDefaultNewPlaylistName(): Promise<string> {
    const mediaPlaylistsCount = await MediaPlaylistDatastore.countMediaPlaylists();

    return `${I18nService.getString('label_new_playlist_default_name', {
      playlistCount: (mediaPlaylistsCount + 1).toString(),
    })}`;
  }

  private buildMediaPlaylistTrackFromInput(trackInputData: IMediaPlaylistTrackInputData): IMediaPlaylistTrackData {
    return {
      playlist_track_id: DatastoreUtils.generateId(),
      provider: trackInputData.provider,
      provider_id: trackInputData.provider_id,
      added_at: Date.now(),
    };
  }

  private async buildMediaPlaylistUpdateDataFromInput(playlistId: string, playlistUpdateData: IMediaPlaylistUpdateData): Promise<DataStoreUpdateData<IMediaPlaylistData>> {
    const data: DataStoreUpdateData<IMediaPlaylistData> = {};
    if (playlistUpdateData.name) {
      data.name = playlistUpdateData.name;
    }
    if (playlistUpdateData.cover_picture) {
      data.cover_picture = playlistUpdateData.cover_picture;
    }
    if (playlistUpdateData.tracks) {
      data.tracks = await this.buildMediaPlaylistTrackUpdateDataFromInput(playlistId, playlistUpdateData.tracks);
    }

    return data;
  }

  private async buildMediaPlaylistTrackUpdateDataFromInput(playlistId: string, playlistTrackUpdateDataList: IMediaPlaylistTrackUpdateData[]): Promise<IMediaPlaylistTrackData[]> {
    // we got tracks to update, we only get playlist_track_id in the order we required
    // we also can have deleted ids, no addition is allowed
    // build the new set of playlist tracks in order we require and set them directly
    const playlistData = await MediaPlaylistDatastore.findMediaPlaylist({
      id: playlistId,
    });
    if (!playlistData) {
      throw new Error(`MediaLibraryService encountered error at buildMediaPlaylistTrackUpdateDataFromInput - Could not find playlist - ${playlistId}`);
    }

    const playlistUpdatedTracks: IMediaPlaylistTrackData[] = [];
    playlistTrackUpdateDataList.forEach((trackUpdateData) => {
      const playlistTrackData = playlistData.tracks.find(
        trackData => trackData.playlist_track_id === trackUpdateData.playlist_track_id,
      );
      // no addition allowed
      if (!playlistTrackData) {
        throw new Error(`MediaLibraryService encountered error at buildMediaPlaylistTrackUpdateDataFromInput - Could not find track in playlist - ${trackUpdateData.playlist_track_id}`);
      }

      playlistUpdatedTracks.push(playlistTrackData);
    });

    return playlistUpdatedTracks;
  }

  private async getExistingMediaPlaylistTrackInputData(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[]): Promise<{
    existingInputDataList: IMediaPlaylistTrackInputData[],
    newInputDataList: IMediaPlaylistTrackInputData[],
  }> {
    const playlist = await this.getMediaPlaylist(mediaPlaylistId);
    if (!playlist) {
      throw new Error(`MediaLibraryService encountered error at getExistingMediaPlaylistTrackInputData - Playlist not found - ${mediaPlaylistId}`);
    }

    const existingInputDataList: IMediaPlaylistTrackInputData[] = [];
    const newInputDataList: IMediaPlaylistTrackInputData[] = [];

    mediaPlaylistTrackInputDataList.forEach((trackData) => {
      const playlistTrack = playlist.tracks.find(
        data => data.provider === trackData.provider && data.provider_id === trackData.provider_id,
      );
      if (playlistTrack) {
        // existing track
        existingInputDataList.push(trackData);
      } else {
        // new track
        newInputDataList.push(trackData);
      }
    });

    return {
      existingInputDataList,
      newInputDataList,
    };
  }
}

export default new MediaPlaylistService();
