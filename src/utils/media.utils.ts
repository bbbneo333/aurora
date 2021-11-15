import * as _ from 'lodash';

import {IMediaAlbum, IMediaArtist, IMediaTrack} from '../interfaces';

export function mediaNameSanitizerForComparator(mediaName: string): string {
  return mediaName.replace(/[^A-Z0-9]/ig, '');
}

export function mediaAlbumInsertionComparator(
  mediaAlbumA: IMediaAlbum,
  mediaAlbumB: IMediaAlbum,
) {
  return mediaNameSanitizerForComparator(mediaAlbumA.album_name) < mediaNameSanitizerForComparator(mediaAlbumB.album_name) ? -1 : 1;
}

export function mediaArtistInsertionComparator(
  mediaArtistA: IMediaArtist,
  mediaArtistB: IMediaArtist,
) {
  return mediaNameSanitizerForComparator(mediaArtistA.artist_name) < mediaNameSanitizerForComparator(mediaArtistB.artist_name) ? -1 : 1;
}

export function mediaTrackInsertComparator(
  mediaTrackA: IMediaTrack,
  mediaTrackB: IMediaTrack,
) {
  return mediaTrackA.track_number < mediaTrackB.track_number ? -1 : 1;
}

export function mediaAlbumTrackSort(
  mediaAlbumTracks: IMediaTrack[],
): IMediaTrack[] {
  return _.sortBy(mediaAlbumTracks, (mediaAlbumTrack: IMediaTrack) => mediaAlbumTrack.track_number);
}
