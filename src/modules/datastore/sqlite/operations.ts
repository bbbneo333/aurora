import { DATASTORE_SCHEMAS } from '../schema';
import { DatastoreOperation } from '../types';
import { SQLiteConnection } from './connection';
import { hydrateDatastoreRow } from './mapper';
import { quoteIdentifier, UnsupportedDatastoreOperationError } from './query';

const SEARCH_FIELDS: Record<string, string> = {
  media_tracks: 'track_name',
  media_albums: 'album_name',
  media_artists: 'artist_name',
  media_playlists: 'name',
};

const assertString = (value: unknown, name: string): string => {
  if (typeof value !== 'string') throw new UnsupportedDatastoreOperationError(`${name} must be a string`);
  return value;
};

const assertStringArray = (value: unknown, name: string): string[] => {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new UnsupportedDatastoreOperationError(`${name} must be a string array`);
  }
  return value;
};

export class SQLiteDatastoreOperations {
  private readonly database: SQLiteConnection;

  constructor(database: SQLiteConnection) {
    this.database = database;
  }

  execute(datastoreName: string, operation: string, args: any): any {
    switch (operation) {
      case DatastoreOperation.SearchByName:
        return this.searchByName(datastoreName, assertString(args?.query, 'query'));
      case DatastoreOperation.FindByIds:
        return this.findByIds(datastoreName, assertStringArray(args?.ids, 'ids'));
      case DatastoreOperation.FindTracksByArtistId:
        return this.findTracksByArtistId(datastoreName, assertString(args?.artistId, 'artistId'));
      case DatastoreOperation.AddPlaylistTracks:
        return this.addPlaylistTracks(datastoreName, args);
      case DatastoreOperation.RemovePlaylistTracks:
        return this.removePlaylistTracks(datastoreName, args);
      default:
        throw new UnsupportedDatastoreOperationError(`named operation ${operation}`);
    }
  }

  private searchByName(datastoreName: string, query: string): any[] {
    const schema = DATASTORE_SCHEMAS[datastoreName];
    const field = SEARCH_FIELDS[datastoreName];
    if (!schema || !field) throw new UnsupportedDatastoreOperationError(`search for ${datastoreName}`);

    const nameColumn = quoteIdentifier(schema.columns[field].name);
    const rows = this.database.prepare(
      `SELECT * FROM ${quoteIdentifier(schema.table)} WHERE instr(lower(${nameColumn}), lower(?)) > 0`,
    ).all(query);
    return rows.map(row => hydrateDatastoreRow(schema, row));
  }

  private findByIds(datastoreName: string, ids: string[]): any[] {
    const schema = DATASTORE_SCHEMAS[datastoreName];
    if (!schema) throw new UnsupportedDatastoreOperationError(`ID lookup for ${datastoreName}`);
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(', ');
    const rows = this.database.prepare(
      `SELECT * FROM ${quoteIdentifier(schema.table)} WHERE id IN (${placeholders})`,
    ).all(...ids);
    return rows.map(row => hydrateDatastoreRow(schema, row));
  }

  private findTracksByArtistId(datastoreName: string, artistId: string): any[] {
    if (datastoreName !== 'media_tracks') {
      throw new UnsupportedDatastoreOperationError(`artist-track lookup for ${datastoreName}`);
    }
    const schema = DATASTORE_SCHEMAS.media_tracks;
    const rows = this.database.prepare(`
      SELECT media_tracks.*
      FROM media_tracks
      WHERE EXISTS (
        SELECT 1
        FROM json_each(media_tracks.track_artist_ids)
        WHERE json_each.value = ?
      )
    `).all(artistId);
    return rows.map(row => hydrateDatastoreRow(schema, row));
  }

  private addPlaylistTracks(datastoreName: string, args: any): any {
    this.assertPlaylistDatastore(datastoreName);
    const playlistId = assertString(args?.playlistId, 'playlistId');
    if (!Array.isArray(args?.tracks)) {
      throw new UnsupportedDatastoreOperationError('tracks must be an array');
    }

    return this.updatePlaylistTracks(playlistId, tracks => [...tracks, ...args.tracks]);
  }

  private removePlaylistTracks(datastoreName: string, args: any): any {
    this.assertPlaylistDatastore(datastoreName);
    const playlistId = assertString(args?.playlistId, 'playlistId');
    const trackIds = new Set(assertStringArray(args?.playlistTrackIds, 'playlistTrackIds'));
    return this.updatePlaylistTracks(
      playlistId,
      tracks => tracks.filter(track => !trackIds.has(track.playlist_track_id)),
    );
  }

  private updatePlaylistTracks(playlistId: string, update: (tracks: any[]) => any[]): any {
    const schema = DATASTORE_SCHEMAS.media_playlists;
    return this.database.transaction(() => {
      const row = this.database.prepare('SELECT * FROM media_playlists WHERE id = ?').get(playlistId);
      if (!row) return undefined;

      const tracks = JSON.parse(String(row.tracks));
      if (!Array.isArray(tracks)) throw new Error(`Playlist ${playlistId} has invalid track data`);
      const updatedRow = this.database.prepare(
        'UPDATE media_playlists SET tracks = ?, updated_at = ? WHERE id = ? RETURNING *',
      ).get(JSON.stringify(update(tracks)), Date.now(), playlistId);
      return updatedRow ? hydrateDatastoreRow(schema, updatedRow) : undefined;
    });
  }

  private assertPlaylistDatastore(datastoreName: string): void {
    if (datastoreName !== 'media_playlists') {
      throw new UnsupportedDatastoreOperationError(`playlist operation for ${datastoreName}`);
    }
  }
}
