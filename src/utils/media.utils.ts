import { IMediaAlbum, IMediaArtist, IMediaTrack } from '../interfaces';

export function mediaNameSanitizerForComparator(mediaName: string): string {
  return mediaName.replace(/[^A-Z0-9]/ig, '');
}

export function mediaAlbumComparator(
  mediaAlbumA: IMediaAlbum,
  mediaAlbumB: IMediaAlbum,
) {
  return mediaNameSanitizerForComparator(mediaAlbumA.album_name) < mediaNameSanitizerForComparator(mediaAlbumB.album_name) ? -1 : 1;
}

export function mediaArtistComparator(
  mediaArtistA: IMediaArtist,
  mediaArtistB: IMediaArtist,
) {
  return mediaNameSanitizerForComparator(mediaArtistA.artist_name) < mediaNameSanitizerForComparator(mediaArtistB.artist_name) ? -1 : 1;
}

export function mediaTrackComparator(
  mediaTrackA: IMediaTrack,
  mediaTrackB: IMediaTrack,
) {
  return mediaTrackA.track_number < mediaTrackB.track_number ? -1 : 1;
}

export function sortMediaAlbumTracks(
  mediaAlbumTracks: IMediaTrack[],
): IMediaTrack[] {
  return mediaAlbumTracks.sort(mediaTrackComparator);
}

export function sortMediaAlbums(mediaAlbums: IMediaAlbum[]): IMediaAlbum[] {
  return mediaAlbums.sort(mediaAlbumComparator);
}
