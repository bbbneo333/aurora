import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import {
  IMediaAlbumData,
  IMediaPlaylist,
  IMediaPlaylistData,
  IMediaPlaylistInputData,
  IMediaPlaylistSmartMatchMode,
  IMediaPlaylistSmartRuleData,
  IMediaTrack,
  IMediaPlaylistTrack,
  IMediaPlaylistTrackData,
  IMediaPlaylistTrackInputData,
  IMediaPlaylistTrackUpdateData,
  IMediaPlaylistUpdateData,
} from '../interfaces';

import { MediaAlbumDatastore, MediaPlaylistDatastore, MediaTrackDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import store from '../store';
import { BaseError, EntityNotFoundError } from '../types';
import { MediaUtils } from '../utils';

import { DataStoreInputData, DataStoreUpdateData, DatastoreUtils } from '../modules/datastore';

import { I18nService } from './i18n.service';
import { MediaTrackService } from './media-track.service';
import { NotificationService } from './notification.service';
import { AppService } from './app.service';

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

export class MediaPlaylistService {
  static readonly removeOnMissing = false;

  static loadMediaPlaylists(): void {
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

  static loadMediaPlaylist(mediaPlaylistId: string): void {
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

  static unloadMediaPlaylist(): void {
    store.dispatch({
      type: MediaLibraryActions.SetPlaylist,
      data: {
        mediaPlaylist: undefined,
      },
    });
  }

  static async searchPlaylistsByName(query: string): Promise<IMediaPlaylist[]> {
    const playlists = await MediaPlaylistDatastore.findMediaPlaylists({
      name: {
        $regex: new RegExp(query, 'i'),
      },
    });

    return this.buildMediaPlaylists(playlists);
  }

  static async getMediaPlaylist(mediaPlaylistId: string): Promise<IMediaPlaylist | undefined> {
    let mediaPlaylistData = await MediaPlaylistDatastore.findMediaPlaylist({
      id: mediaPlaylistId,
    });

    if (mediaPlaylistData) {
      mediaPlaylistData = await this.syncSmartPlaylistData(mediaPlaylistData);
      return this.buildMediaPlaylist(mediaPlaylistData);
    }

    const mediaAlbumData = await MediaAlbumDatastore.findMediaAlbumById(mediaPlaylistId);
    if (mediaAlbumData && mediaAlbumData.hidden) {
      return this.buildMediaPlaylistFromAlbum(mediaAlbumData);
    }

    return undefined;
  }

  static async resolveMediaPlaylistTracks(mediaPlaylistId: string): Promise<IMediaPlaylistTrack[]> {
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

  static async getMediaPlaylists(): Promise<IMediaPlaylist[]> {
    const mediaPlaylistsDataList = await MediaPlaylistDatastore.findMediaPlaylists();
    const mediaPlaylistsDataResolved = await Promise.all(
      mediaPlaylistsDataList.map(mediaPlaylistData => this.syncSmartPlaylistData(mediaPlaylistData)),
    );

    const mediaPlaylists = await Promise.all(
      mediaPlaylistsDataResolved.map(mediaPlaylistData => this.buildMediaPlaylist(mediaPlaylistData)),
    );

    const hiddenAlbums = await MediaAlbumDatastore.findMediaAlbums({
      hidden: true,
    });

    if (!_.isEmpty(hiddenAlbums)) {
      const hiddenAlbumIds = hiddenAlbums.map(album => album.id);
      const allTracks = await MediaTrackDatastore.findMediaTracks({
        track_album_id: {
          $in: hiddenAlbumIds,
        },
      });
      const tracksByAlbumId = _.groupBy(allTracks, 'track_album_id');

      const hiddenAlbumPlaylists = await Promise.all(
        hiddenAlbums.map(async (album) => {
          const tracks = tracksByAlbumId[album.id] || [];
          const playlistTracks: IMediaPlaylistTrackData[] = tracks.map(track => ({
            playlist_track_id: track.id,
            provider: track.provider,
            provider_id: track.provider_id,
            added_at: track.sync_timestamp,
          }));
          return this.buildMediaPlaylistFromAlbum(album, playlistTracks);
        }),
      );
      return MediaUtils.sortMediaPlaylists([...mediaPlaylists, ...hiddenAlbumPlaylists]);
    }

    return MediaUtils.sortMediaPlaylists(mediaPlaylists);
  }

  static async createMediaPlaylist(mediaPlaylistInputData?: IMediaPlaylistInputData): Promise<IMediaPlaylist> {
    const inputData: DataStoreInputData<IMediaPlaylistData> = _.defaults(mediaPlaylistInputData, {
      name: await this.getDefaultNewPlaylistName(),
      tracks: [],
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

  static async createIntelligentMediaPlaylist(input: {
    name?: string;
    matchMode?: IMediaPlaylistSmartMatchMode;
    rules: IMediaPlaylistSmartRuleData[];
  }): Promise<IMediaPlaylist> {
    const rules = (input.rules || [])
      .map(rule => ({
        keyword: rule.keyword,
        pattern: (rule.pattern || '').trim(),
      }))
      .filter(rule => !!rule.pattern);
    if (_.isEmpty(rules)) {
      throw new Error('Cannot create intelligent playlist without rules');
    }

    const matchMode: IMediaPlaylistSmartMatchMode = input.matchMode || 'all';
    const tracks = await this.resolveSmartPlaylistTrackInputData(rules, matchMode);
    const mediaPlaylist = await this.createMediaPlaylist({
      name: input.name,
      tracks,
      is_smart: true,
      smart_match_mode: matchMode,
      smart_rules: rules,
    });
    return mediaPlaylist;
  }

  static async exportMediaPlaylist(mediaPlaylistId: string, format: 'm3u' | 'm3u8'): Promise<string> {
    const mediaPlaylist = await this.getMediaPlaylist(mediaPlaylistId);
    if (!mediaPlaylist) {
      throw new Error(`MediaPlaylistService encountered error at exportMediaPlaylist - Playlist not found - ${mediaPlaylistId}`);
    }

    const playlistTracks = await this.resolveMediaPlaylistTracks(mediaPlaylistId);
    const playlistDirectoryPath = this.getPlaylistsDirectoryPath();
    fs.mkdirSync(playlistDirectoryPath, { recursive: true });

    const fileName = `${this.sanitizePlaylistFileName(mediaPlaylist.name)}.${format}`;
    const filePath = path.join(playlistDirectoryPath, fileName);

    const lines: string[] = ['#EXTM3U'];
    playlistTracks.forEach((track) => {
      const trackFilePath = _.get(track, 'extra.file_path');
      if (!trackFilePath || typeof trackFilePath !== 'string') {
        return;
      }

      const artist = track.track_artists?.[0]?.artist_name || track.track_album?.album_artist?.artist_name || '';
      const trackName = track.track_name || '';
      const title = artist ? `${artist} - ${trackName}` : trackName;
      const duration = Math.max(0, Math.round(track.track_duration || 0));
      const relativePath = (path.relative(playlistDirectoryPath, trackFilePath) || path.basename(trackFilePath)).split(path.sep).join('/');

      lines.push(`#EXTINF:${duration},${title}`);
      lines.push(relativePath);
    });

    fs.writeFileSync(filePath, `${lines.join('\n')}\n`, {
      encoding: 'utf8',
    });

    NotificationService.showMessage(I18nService.getString('message_playlist_exported', {
      playlistName: mediaPlaylist.name,
      format: format.toUpperCase(),
    }));

    return filePath;
  }

  /**
   * @throws MediaLibraryPlaylistDuplicateTracksError
   */
  static async addMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[], options?: {
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

  static async updateMediaPlaylist(mediaPlaylistId: string, mediaPlaylistUpdateData: IMediaPlaylistUpdateData): Promise<IMediaPlaylist> {
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

  static async deleteMediaPlaylist(mediaPlaylistId: string): Promise<void> {
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

  static async deleteMediaPlaylistTracks(mediaPlaylistId: string, mediaPlaylistTrackIds: string[]): Promise<IMediaPlaylist> {
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

  private static async buildMediaPlaylist(mediaPlaylistData: IMediaPlaylistData) {
    return _.assign(mediaPlaylistData, {});
  }

  private static async buildMediaPlaylistFromAlbum(mediaAlbumData: IMediaAlbumData, tracks?: IMediaPlaylistTrackData[]): Promise<IMediaPlaylist> {
    let playlistTracks = tracks;
    if (!playlistTracks) {
      const albumTracks = await MediaTrackDatastore.findMediaTracks({
        track_album_id: mediaAlbumData.id,
      });
      playlistTracks = albumTracks.map(track => ({
        playlist_track_id: track.id,
        provider: track.provider,
        provider_id: track.provider_id,
        added_at: track.sync_timestamp,
      }));
    }

    return {
      id: mediaAlbumData.id,
      name: mediaAlbumData.album_name,
      tracks: playlistTracks || [],
      cover_picture: mediaAlbumData.album_cover_picture,
      created_at: mediaAlbumData.sync_timestamp,
      updated_at: mediaAlbumData.sync_timestamp,
      is_hidden_album: true,
    };
  }

  private static async buildMediaPlaylists(mediaPlaylistDataList: IMediaPlaylistData[]) {
    return Promise.all(mediaPlaylistDataList.map((mediaPlaylistData: any) => this.buildMediaPlaylist(mediaPlaylistData)));
  }

  private static async buildMediaPlaylistTrack(mediaPlaylistTrackData: IMediaPlaylistTrackData): Promise<IMediaPlaylistTrack> {
    const mediaTrack = await MediaTrackService.getMediaTrackForProvider(mediaPlaylistTrackData.provider, mediaPlaylistTrackData.provider_id);
    if (!mediaTrack) {
      throw new EntityNotFoundError(`${mediaPlaylistTrackData.provider}-${mediaPlaylistTrackData.provider_id}`, 'track');
    }

    return {
      ...mediaTrack,
      ...mediaPlaylistTrackData,
    };
  }

  private static async getDefaultNewPlaylistName(): Promise<string> {
    const mediaPlaylistsCount = await MediaPlaylistDatastore.countMediaPlaylists();

    return `${I18nService.getString('label_new_playlist_default_name', {
      playlistCount: (mediaPlaylistsCount + 1).toString(),
    })}`;
  }

  private static buildMediaPlaylistTrackFromInput(trackInputData: IMediaPlaylistTrackInputData): IMediaPlaylistTrackData {
    return {
      playlist_track_id: DatastoreUtils.generateId(),
      provider: trackInputData.provider,
      provider_id: trackInputData.provider_id,
      added_at: Date.now(),
    };
  }

  private static async buildMediaPlaylistUpdateDataFromInput(playlistId: string, playlistUpdateData: IMediaPlaylistUpdateData): Promise<DataStoreUpdateData<IMediaPlaylistData>> {
    const data: DataStoreUpdateData<IMediaPlaylistData> = {};
    if (playlistUpdateData.name) {
      data.name = playlistUpdateData.name;
    }
    if (playlistUpdateData.cover_picture) {
      data.cover_picture = playlistUpdateData.cover_picture;
    }
    if (!_.isUndefined(playlistUpdateData.is_smart)) {
      data.is_smart = playlistUpdateData.is_smart;
    }
    if (playlistUpdateData.smart_match_mode) {
      data.smart_match_mode = playlistUpdateData.smart_match_mode;
    }
    if (playlistUpdateData.smart_rules) {
      data.smart_rules = playlistUpdateData.smart_rules;
    }
    if (playlistUpdateData.tracks) {
      data.tracks = await this.buildMediaPlaylistTrackUpdateDataFromInput(playlistId, playlistUpdateData.tracks);
    }

    return data;
  }

  private static async buildMediaPlaylistTrackUpdateDataFromInput(playlistId: string, playlistTrackUpdateDataList: IMediaPlaylistTrackUpdateData[]): Promise<IMediaPlaylistTrackData[]> {
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

  private static async getExistingMediaPlaylistTrackInputData(mediaPlaylistId: string, mediaPlaylistTrackInputDataList: IMediaPlaylistTrackInputData[]): Promise<{
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

  private static async resolveSmartPlaylistTrackInputData(
    rules: IMediaPlaylistSmartRuleData[],
    matchMode: IMediaPlaylistSmartMatchMode,
  ): Promise<IMediaPlaylistTrackInputData[]> {
    const mediaTrackDataList = await MediaTrackDatastore.findMediaTracks();
    const mediaTracks = await MediaTrackService.buildMediaTracks(mediaTrackDataList);

    const matchingTracks = mediaTracks.filter((track) => {
      const ruleMatches = rules.map(rule => this.matchSmartPlaylistRule(track, rule));
      return matchMode === 'any'
        ? ruleMatches.some(Boolean)
        : ruleMatches.every(Boolean);
    });

    return matchingTracks.map(track => ({
      provider: track.provider,
      provider_id: track.provider_id,
    }));
  }

  private static async syncSmartPlaylistData(mediaPlaylistData: IMediaPlaylistData): Promise<IMediaPlaylistData> {
    if (!mediaPlaylistData.is_smart || _.isEmpty(mediaPlaylistData.smart_rules)) {
      return mediaPlaylistData;
    }

    const matchMode: IMediaPlaylistSmartMatchMode = mediaPlaylistData.smart_match_mode || 'all';
    const smartTrackInputData = await this.resolveSmartPlaylistTrackInputData(mediaPlaylistData.smart_rules || [], matchMode);
    const smartTracks = smartTrackInputData.map(trackInputData => this.buildMediaPlaylistTrackFromInput(trackInputData));
    const existingTracks = mediaPlaylistData.tracks || [];
    const hasChanged = existingTracks.length !== smartTracks.length
      || existingTracks.some((track, index) => (
        track.provider !== smartTracks[index]?.provider
        || track.provider_id !== smartTracks[index]?.provider_id
      ));

    if (!hasChanged) {
      return mediaPlaylistData;
    }

    return MediaPlaylistDatastore.updateMediaPlaylist(mediaPlaylistData.id, {
      tracks: smartTracks,
    });
  }

  private static matchSmartPlaylistRule(
    track: IMediaTrack,
    rule: IMediaPlaylistSmartRuleData,
  ): boolean {
    const regex = this.buildWildcardRegex(rule.pattern);
    const values = this.getTrackValuesForSmartKeyword(track, rule.keyword);
    return values.some(value => regex.test(value));
  }

  private static getTrackValuesForSmartKeyword(
    track: IMediaTrack,
    keyword: IMediaPlaylistSmartRuleData['keyword'],
  ): string[] {
    if (keyword === 'track') {
      return [track.track_name];
    }
    if (keyword === 'album') {
      return [track.track_album?.album_name || ''];
    }
    if (keyword === 'artist') {
      return [
        ...(track.track_artists || []).map(artist => artist.artist_name),
        track.track_album?.album_artist?.artist_name || '',
      ].filter(Boolean);
    }
    if (keyword === 'genre') {
      return [track.track_album?.album_genre || ''];
    }
    if (keyword === 'path') {
      return [
        _.get(track, 'extra.file_path', ''),
        _.get(track, 'extra.file_source', ''),
      ].filter(Boolean);
    }

    return [];
  }

  private static buildWildcardRegex(pattern: string): RegExp {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escapedPattern}$`, 'i');
  }

  private static sanitizePlaylistFileName(name: string): string {
    const value = (name || 'playlist')
      .trim()
      .replace(/[<>:"/\\|?*]/g, '_');
    return value || 'playlist';
  }

  private static getPlaylistsDirectoryPath(): string {
    const logsPath = AppService.details.logs_path;
    const appDataPath = path.dirname(path.dirname(logsPath));
    return path.join(appDataPath, 'Playlists');
  }
}
