import {IMediaProvider, IMediaTrack} from '../interfaces';
import {MediaEnums} from '../enums';
import MediaProviderService from './media-provider.service';

import store from '../store';

class MediaLibraryService {
  constructor() {
    // subscribe to media provider updates
    MediaProviderService.mediaProviderUpdates.on(MediaEnums.MediaProviderUpdateEvent.AddedProvider, MediaLibraryService.registerMediaProviderHandles);
  }

  addMediaTracks(): void {
    // requests to add media tracks from default media provider
    const mediaProvider = MediaProviderService.getDefaultMediaProvider();
    mediaProvider.mediaLibraryService.addMediaTracks();
  }

  removeMediaTrack(mediaTrack: IMediaTrack): void {
    const mediaProvider = MediaProviderService.getMediaProvider(mediaTrack.provider);
    const mediaTrackWasRemoved = mediaProvider.mediaLibraryService.removeMediaTrack(mediaTrack);

    if (!mediaTrackWasRemoved) {
      throw new Error(`MediaLibraryService encountered error at removeMediaTrack - Media track could not be removed for provider - ${mediaTrack.provider}`);
    }

    store.dispatch({
      type: MediaEnums.MediaLibraryActions.RemoveTrack,
      data: {
        mediaTrackId: mediaTrack.id,
      },
    });
  }

  private static registerMediaProviderHandles(mediaProvider: IMediaProvider): void {
    mediaProvider.mediaLibraryService.mediaLibraryUpdates.on(MediaEnums.MediaLibraryUpdateEvent.AddedTrack, MediaLibraryService.addMediaTrackToLibrary);
  }

  private static addMediaTrackToLibrary(mediaTrack: IMediaTrack): void {
    store.dispatch({
      type: MediaEnums.MediaLibraryActions.AddTrack,
      data: {
        mediaTrack,
      },
    });
  }
}

export default new MediaLibraryService();
