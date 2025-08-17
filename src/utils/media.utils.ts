import {
  IMediaAlbum,
  IMediaArtist,
  IMediaCollectionItem,
  IMediaPlaylist,
  IMediaTrack,
} from '../interfaces';

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

export function mediaArtistTrackComparator(
  mediaTrackA: IMediaTrack,
  mediaTrackB: IMediaTrack,
) {
  return `${mediaNameSanitizerForComparator(mediaTrackA.track_album.album_name)}-${mediaTrackA.track_number}`
  < `${mediaNameSanitizerForComparator(mediaTrackB.track_album.album_name)}-${mediaTrackB.track_number}` ? -1 : 1;
}

export function mediaPlaylistComparator(
  mediaPlaylistA: IMediaPlaylist,
  mediaPlaylistB: IMediaPlaylist,
) {
  return mediaPlaylistA.created_at > mediaPlaylistB.created_at ? -1 : 1;
}

export function sortMediaAlbumTracks(
  mediaAlbumTracks: IMediaTrack[],
): IMediaTrack[] {
  return mediaAlbumTracks.sort(mediaTrackComparator);
}

export function sortMediaAlbums(mediaAlbums: IMediaAlbum[]): IMediaAlbum[] {
  return mediaAlbums.sort(mediaAlbumComparator);
}

export function sortMediaArtists(mediaArtists: IMediaArtist[]): IMediaArtist[] {
  return mediaArtists.sort(mediaArtistComparator);
}

export function sortMediaArtistTracks(
  mediaTracks: IMediaTrack[],
): IMediaTrack[] {
  return mediaTracks.sort(mediaArtistTrackComparator);
}

export function sortMediaPlaylists(
  mediaPlaylists: IMediaPlaylist[],
): IMediaPlaylist[] {
  return mediaPlaylists.sort(mediaPlaylistComparator);
}

export function getMediaItemFromAlbum(mediaAlbum: IMediaAlbum): IMediaCollectionItem {
  return {
    id: mediaAlbum.id,
    type: 'album',
    name: mediaAlbum.album_name,
    picture: mediaAlbum.album_cover_picture,
  };
}

export function getMediaItemFromArtist(mediaArtist: IMediaArtist): IMediaCollectionItem {
  return {
    id: mediaArtist.id,
    name: mediaArtist.artist_name,
    type: 'artist',
    picture: mediaArtist.artist_feature_picture,
  };
}

export function getMediaItemFromPlaylist(mediaPlaylist: IMediaPlaylist): IMediaCollectionItem {
  return {
    id: mediaPlaylist.id,
    name: mediaPlaylist.name,
    type: 'playlist',
    picture: mediaPlaylist.cover_picture,
  };
}
