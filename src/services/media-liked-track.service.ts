import { omit } from 'lodash';

import store from '../store';
import { IMediaLikedTrack, IMediaLikedTrackData, IMediaLikedTrackInputData } from '../interfaces';
import { MediaLikedTrackDatastore } from '../datastores';
import { MediaLibraryActions } from '../enums';
import { EntityNotFoundError } from '../types';
import { MediaUtils } from '../utils';

import { I18nService } from './i18n.service';
import { MediaTrackService } from './media-track.service';
import { NotificationService } from './notification.service';

export class MediaLikedTrackService {
  static readonly removeOnMissing = false;

  static loadLikedTracks() {
    this.resolveLikedTracks()
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

  static loadTrackLikedStatus(input: IMediaLikedTrackInputData) {
    this.getLikedTrack(input)
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
              mediaLikedTrackInput: input,
            },
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  static async getLikedTrack(input: IMediaLikedTrackInputData): Promise<IMediaLikedTrack | undefined> {
    try {
      const likedTrackData = await MediaLikedTrackDatastore.findLikedTrack({
        provider: input.provider,
        provider_id: input.provider_id,
      });

      return likedTrackData ? await this.buildLikedTrack(likedTrackData) : undefined;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        console.warn(error);
        return undefined;
      }

      throw error;
    }
  }

  static async resolveLikedTracks(): Promise<IMediaLikedTrack[]> {
    // this function fetches liked tracks along with the linked media track
    // in case media track is not found, it removes the liked track entry (if enabled)
    const likedTrackDataList = await MediaLikedTrackDatastore.findLikedTracks();
    const likedTracks: IMediaLikedTrack[] = [];

    await Promise.map(likedTrackDataList, async (data) => {
      try {
        const track = await this.buildLikedTrack(data);
        likedTracks.push(track);
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          console.warn(error);

          if (this.removeOnMissing) {
            await this.removeTrackFromLiked({
              provider: data.provider,
              provider_id: data.provider_id,
            }, {
              skipUserNotification: true,
            });
          }
        }
      }
    });

    // const likedTracks = await Promise.map(likedTrackDataList, likedTrackData => this.buildLikedTrack(likedTrackData));

    return MediaUtils.sortMediaLikedTracks(likedTracks);
  }

  static async addTrackToLiked(input: IMediaLikedTrackInputData, options?: { skipUserNotification?: boolean }): Promise<IMediaLikedTrack> {
    // we will always remove existing entry before adding a new one
    await this.removeTrackFromLiked({
      provider: input.provider,
      provider_id: input.provider_id,
    }, {
      skipUserNotification: true,
    });

    // now add
    const likedTrackData = await MediaLikedTrackDatastore.insertLikedTrack({
      provider: input.provider,
      provider_id: input.provider_id,
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

  static async addTracksToLiked(inputList: IMediaLikedTrackInputData[], options?: { skipUserNotification?: boolean }): Promise<IMediaLikedTrack[]> {
    const mediaLikedTracks = await Promise.map(inputList, input => this.addTrackToLiked({
      provider: input.provider,
      provider_id: input.provider_id,
    }, {
      skipUserNotification: true,
    }));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_liked'));
    }

    return mediaLikedTracks;
  }

  static async removeTrackFromLiked(input: IMediaLikedTrackInputData, options?: { skipUserNotification?: boolean }): Promise<void> {
    await MediaLikedTrackDatastore.deleteLikedTrack({
      provider: input.provider,
      provider_id: input.provider_id,
    });

    store.dispatch({
      type: MediaLibraryActions.RemoveMediaTrackFromLiked,
      data: {
        mediaLikedTrackInput: input,
      },
    });

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_track_disliked'));
    }
  }

  static async removeTracksFromLiked(inputList: IMediaLikedTrackInputData[], options?: { skipUserNotification?: boolean }): Promise<void> {
    await Promise.map(inputList, input => this.removeTrackFromLiked({
      provider: input.provider,
      provider_id: input.provider_id,
    }, {
      skipUserNotification: true,
    }));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_disliked'));
    }
  }

  static async getLikedTracksCount(): Promise<number> {
    return MediaLikedTrackDatastore.countLikedTracks();
  }

  private static async buildLikedTrack(likedTrackData: IMediaLikedTrackData): Promise<IMediaLikedTrack> {
    const track = await MediaTrackService.getMediaTrackForProvider(likedTrackData.provider, likedTrackData.provider_id);
    if (!track) {
      throw new EntityNotFoundError(`${likedTrackData.provider}-${likedTrackData.provider_id}`, 'track');
    }

    return {
      ...track,
      ...omit(likedTrackData, 'id'),
      liked_track_id: likedTrackData.id,
    };
  }
}
