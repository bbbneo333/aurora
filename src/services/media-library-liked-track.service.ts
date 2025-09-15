import { omit } from 'lodash';

import store from '../store';
import { IMediaLikedTrack, IMediaLikedTrackData } from '../interfaces';
import { MediaLikedTrackDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';

import MediaLibraryService from './media-library.service';
import NotificationService from './notification.service';
import I18nService from './i18n.service';

class MediaLibraryLikedTrackService {
  loadLikedTracks() {
    this.getLikedTracks()
      .then((tracks: IMediaLikedTrack[]) => {
        store.dispatch({
          type: MediaLibraryActions.SetLikedTracks,
          data: {
            mediaLikedTracks: tracks,
          },
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  loadTrackLikedStatus(trackId: string) {
    this.getLikedTrack(trackId)
      .then((mediaLikedTrack) => {
        if (mediaLikedTrack) {
          store.dispatch({
            type: MediaLibraryActions.AddMediaTrackToLiked,
            data: {
              mediaLikedTrack,
            },
          });
        } else {
          store.dispatch({
            type: MediaLibraryActions.RemoveMediaTrackFromLiked,
            data: {
              mediaTrackId: trackId,
            },
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getLikedTrack(trackId: string): Promise<IMediaLikedTrack | undefined> {
    const likedTrackData = await MediaLikedTrackDatastore.findLikedTrack({
      track_id: trackId,
    });

    return likedTrackData ? this.buildLikedTrack(likedTrackData) : undefined;
  }

  async getLikedTracks(): Promise<IMediaLikedTrack[]> {
    const likedTrackDataList = await MediaLikedTrackDatastore.findLikedTracks();

    return Promise.map(likedTrackDataList, likedTrackData => this.buildLikedTrack(likedTrackData));
  }

  async addTrackToLiked(trackId: string, options?: { skipUserNotification?: boolean }): Promise<IMediaLikedTrack> {
    // we will always remove existing entry before adding a new one
    await this.removeTrackFromLiked(trackId, {
      skipUserNotification: true,
    });

    // now add
    const likedTrackData = await MediaLikedTrackDatastore.insertLikedTrack({
      track_id: trackId,
      added_at: Date.now(),
    });

    const likedTrack = await this.buildLikedTrack(likedTrackData);

    store.dispatch({
      type: MediaLibraryActions.AddMediaTrackToLiked,
      data: {
        mediaLikedTrack: likedTrack,
      },
    });

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_track_liked'));
    }

    return likedTrack;
  }

  async addTracksToLiked(trackIds: string[], options?: { skipUserNotification?: boolean }): Promise<IMediaLikedTrack[]> {
    const mediaLikedTracks = await Promise.map(trackIds, trackId => this.addTrackToLiked(trackId, {
      skipUserNotification: true,
    }));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_liked'));
    }

    return mediaLikedTracks;
  }

  async removeTrackFromLiked(trackId: string, options?: { skipUserNotification?: boolean }): Promise<void> {
    await MediaLikedTrackDatastore.deleteLikedTrack({
      track_id: trackId,
    });

    store.dispatch({
      type: MediaLibraryActions.RemoveMediaTrackFromLiked,
      data: {
        mediaTrackId: trackId,
      },
    });

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_track_disliked'));
    }
  }

  async removeTracksFromLiked(trackIds: string[], options?: { skipUserNotification?: boolean }): Promise<void> {
    await Promise.map(trackIds, trackId => this.removeTrackFromLiked(trackId, {
      skipUserNotification: true,
    }));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_disliked'));
    }
  }

  async getLikedTracksCount(): Promise<number> {
    return MediaLikedTrackDatastore.countLikedTracks();
  }

  private async buildLikedTrack(likedTrackData: IMediaLikedTrackData): Promise<IMediaLikedTrack> {
    const track = await MediaLibraryService.getMediaTrack(likedTrackData.track_id);
    if (!track) {
      throw new Error(`Encountered error at buildLikedTrack - Could not get track for track_id - ${likedTrackData.track_id}`);
    }

    return {
      ...track,
      ...omit(likedTrackData, 'id'),
    };
  }
}

export default new MediaLibraryLikedTrackService();
