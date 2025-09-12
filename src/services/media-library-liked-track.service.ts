import _ from 'lodash';

import store from '../store';
import { IMediaLikedTrack, IMediaLikedTrackInputData } from '../interfaces';
import { MediaLikedTrackDatastore } from '../datastores';
import { MediaEnums } from '../enums';

import NotificationService from './notification.service';
import I18nService from './i18n.service';

class MediaLibraryLikedTrackService {
  loadTrackLikedStatus(mediaTrackId: string, mediaLikedTrackData: IMediaLikedTrackInputData) {
    this.getLikedTrack(mediaLikedTrackData)
      .then((mediaLikedTrack) => {
        if (mediaLikedTrack) {
          store.dispatch({
            type: MediaEnums.MediaLibraryActions.AddMediaTrackToLiked,
            data: {
              mediaTrackId,
              mediaLikedTrack,
            },
          });
        } else {
          store.dispatch({
            type: MediaEnums.MediaLibraryActions.RemoveMediaTrackFromLiked,
            data: {
              mediaTrackId,
            },
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async checkIfTrackIsLiked(mediaLikedTrackData: IMediaLikedTrackInputData): Promise<boolean> {
    return !_.isNil(await this.getLikedTrack(mediaLikedTrackData));
  }

  async getLikedTrack(mediaLikedTrackData: IMediaLikedTrackInputData): Promise<IMediaLikedTrack | undefined> {
    return MediaLikedTrackDatastore.findLikedTrack({
      provider: mediaLikedTrackData.provider,
      provider_id: mediaLikedTrackData.provider_id,
    });
  }

  async addTrackToLiked(mediaTrackId: string, mediaLikedTrackData: IMediaLikedTrackInputData, options?: { skipUserNotification?: boolean }): Promise<IMediaLikedTrack> {
    // we will always remove existing entry before adding a new one
    await this.removeTrackFromLiked(mediaTrackId, mediaLikedTrackData, {
      skipUserNotification: true,
    });

    // now add
    const mediaLikedTrack = await MediaLikedTrackDatastore.insertLikedTrack({
      provider: mediaLikedTrackData.provider,
      provider_id: mediaLikedTrackData.provider_id,
      created_at: Date.now(),
    });

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddMediaTrackToLiked,
      data: {
        mediaTrackId,
        mediaLikedTrack,
      },
    });

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_track_liked'));
    }

    return mediaLikedTrack;
  }

  async addTracksToLiked(
    mediaLikedTrackInputList: { mediaTrackId: string, mediaLikedTrackData: IMediaLikedTrackInputData }[],
    options?: { skipUserNotification?: boolean },
  ): Promise<IMediaLikedTrack[]> {
    const mediaLikedTracks = await Promise.map(mediaLikedTrackInputList, input => this.addTrackToLiked(
      input.mediaTrackId,
      input.mediaLikedTrackData,
      {
        skipUserNotification: true,
      },
    ));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_liked'));
    }

    return mediaLikedTracks;
  }

  async removeTrackFromLiked(mediaTrackId: string, mediaLikedTrackData: IMediaLikedTrackInputData, options?: { skipUserNotification?: boolean }): Promise<void> {
    await MediaLikedTrackDatastore.deleteLikedTrack({
      provider: mediaLikedTrackData.provider,
      provider_id: mediaLikedTrackData.provider_id,
    });

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemoveMediaTrackFromLiked,
      data: {
        mediaTrackId,
      },
    });

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_track_unliked'));
    }
  }

  async removeTracksFromLiked(
    mediaLikedTrackInputList: { mediaTrackId: string, mediaLikedTrackData: IMediaLikedTrackInputData }[],
    options?: { skipUserNotification?: boolean },
  ): Promise<void> {
    await Promise.map(mediaLikedTrackInputList, input => this.removeTrackFromLiked(
      input.mediaTrackId,
      input.mediaLikedTrackData,
      {
        skipUserNotification: true,
      },
    ));

    if (!options?.skipUserNotification) {
      NotificationService.showMessage(I18nService.getString('message_tracks_unliked'));
    }
  }
}

export default new MediaLibraryLikedTrackService();
