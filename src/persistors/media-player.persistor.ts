import _ from 'lodash';

import { IAppStatePersistor, IMediaQueueTrack } from '../interfaces';
import { MediaLibraryService, MediaPlayerService } from '../services';

import { MediaPlayerState } from '../reducers/media-player.reducer';
import { MediaEnums } from '../enums';

export type MediaQueueTrackSerialized = Pick<IMediaQueueTrack, 'id' | 'provider' | 'provider_id' | 'tracklist_id' | 'queue_entry_id' | 'queue_insertion_index'>;

export type MediaPlayerStateSerialized = Omit<MediaPlayerState, 'mediaTracks' | 'mediaPlaybackCurrentMediaTrack' | 'mediaPlaybackCurrentPlayingInstance'> & {
  mediaTracks: MediaQueueTrackSerialized[],
  mediaPlaybackCurrentMediaTrack?: MediaQueueTrackSerialized;
};

export type MediaPlayerStateDeserialized = MediaPlayerStateSerialized & {};

export default class MediaPlayerPersistor implements IAppStatePersistor {
  async serialize(state: MediaPlayerState): Promise<MediaPlayerStateSerialized> {
    return {
      ..._.omit(state, [
        'mediaTracks',
        'mediaPlaybackCurrentMediaTrack',
        'mediaPlaybackCurrentPlayingInstance',
      ]),
      mediaTracks: state.mediaTracks.map(mediaTrack => this.serializeMediaQueueTrack(mediaTrack)),
      mediaPlaybackCurrentMediaTrack: state.mediaPlaybackCurrentMediaTrack
        ? this.serializeMediaQueueTrack(state.mediaPlaybackCurrentMediaTrack)
        : undefined,
    };
  }

  async deserialize(state: MediaPlayerStateSerialized): Promise<MediaPlayerStateDeserialized> {
    return state;
  }

  async exhaust(stateExisting: MediaPlayerState, stateStored: MediaPlayerStateDeserialized): Promise<void> {
    // exhaust won't run if media player is already playing a track
    // this only happens in case of HotReloads in development
    if (stateExisting.mediaPlaybackState === MediaEnums.MediaPlaybackState.Playing) {
      return;
    }

    const {
      mediaTracks,
      mediaPlaybackCurrentMediaTrack,
      mediaPlaybackCurrentTrackList,
      mediaPlaybackCurrentMediaProgress,
      mediaPlaybackVolumeCurrent,
      mediaPlaybackVolumeMuted,
      mediaPlaybackQueueOnShuffle,
      mediaPlaybackQueueRepeatType,
    } = stateStored;

    // set shuffle, repeat and volume
    MediaPlayerService.setShuffle(mediaPlaybackQueueOnShuffle);
    MediaPlayerService.setRepeat(mediaPlaybackQueueRepeatType);
    MediaPlayerService.changeMediaPlayerVolume(mediaPlaybackVolumeCurrent);

    if (mediaPlaybackVolumeMuted) {
      MediaPlayerService.muteMediaPlayerVolume();
    } else {
      MediaPlayerService.unmuteMediaPlayerVolume();
    }

    // load media queue
    // important - load tracks directly to retain original queue info and shuffle order
    const mediaQueueTracks = await Promise.reduce(mediaTracks, async (mediaTracksDeserialized: IMediaQueueTrack[], mediaTrackSerialized) => {
      const mediaTrack = await MediaLibraryService.getMediaTrack(mediaTrackSerialized.id);

      if (mediaTrack) {
        mediaTracksDeserialized.push({
          ...mediaTrack,
          ...mediaTrackSerialized,
        });
      }

      return mediaTracksDeserialized;
    }, []);
    MediaPlayerService.loadMediaQueueTracks(mediaQueueTracks, mediaPlaybackCurrentTrackList);

    // load current playing track
    if (mediaPlaybackCurrentMediaTrack) {
      const mediaQueueTrack = mediaQueueTracks.find(track => track.id === mediaPlaybackCurrentMediaTrack.id);
      if (mediaQueueTrack) {
        MediaPlayerService.loadMediaTrack(mediaQueueTrack);
        MediaPlayerService.seekMediaTrack(mediaPlaybackCurrentMediaProgress || 0);
      }
    }
  }

  private serializeMediaQueueTrack(mediaTrack: IMediaQueueTrack): MediaQueueTrackSerialized {
    return _.pick(mediaTrack, [
      'id',
      'provider',
      'provider_id',
      'tracklist_id',
      'queue_entry_id',
      'queue_insertion_index',
    ]);
  }
}
