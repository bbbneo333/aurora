export type DatastoreColumnType = 'boolean' | 'json' | 'number' | 'text';

export type DatastoreColumn = {
  name: string;
  type: DatastoreColumnType;
  omitIfNull?: boolean;
};

export type DatastoreSchema = {
  table: string;
  columns: Record<string, DatastoreColumn>;
};

const column = (name: string, type: DatastoreColumnType, omitIfNull = false): DatastoreColumn => ({
  name,
  type,
  omitIfNull,
});

export const DATASTORE_SCHEMAS: Record<string, DatastoreSchema> = {
  media_providers: {
    table: 'media_providers',
    columns: {
      id: column('id', 'text'),
      identifier: column('identifier', 'text'),
      enabled: column('enabled', 'boolean'),
      settings: column('settings', 'json'),
      options: column('options', 'json'),
      sync_started_at: column('sync_started_at', 'number'),
      sync_finished_at: column('sync_finished_at', 'number'),
    },
  },
  media_artists: {
    table: 'media_artists',
    columns: {
      id: column('id', 'text'),
      provider: column('provider', 'text'),
      provider_id: column('provider_id', 'text'),
      sync_timestamp: column('sync_timestamp', 'number'),
      artist_name: column('artist_name', 'text'),
      artist_feature_picture: column('artist_feature_picture', 'json', true),
      extra: column('extra', 'json', true),
    },
  },
  media_albums: {
    table: 'media_albums',
    columns: {
      id: column('id', 'text'),
      provider: column('provider', 'text'),
      provider_id: column('provider_id', 'text'),
      sync_timestamp: column('sync_timestamp', 'number'),
      album_name: column('album_name', 'text'),
      album_artist_id: column('album_artist_id', 'text'),
      album_cover_picture: column('album_cover_picture', 'json', true),
      extra: column('extra', 'json', true),
    },
  },
  media_tracks: {
    table: 'media_tracks',
    columns: {
      id: column('id', 'text'),
      provider: column('provider', 'text'),
      provider_id: column('provider_id', 'text'),
      sync_timestamp: column('sync_timestamp', 'number'),
      track_name: column('track_name', 'text'),
      track_number: column('track_number', 'number'),
      track_duration: column('track_duration', 'number'),
      track_cover_picture: column('track_cover_picture', 'json', true),
      track_artist_ids: column('track_artist_ids', 'json'),
      track_album_id: column('track_album_id', 'text'),
      extra: column('extra', 'json', true),
    },
  },
  media_playlists: {
    table: 'media_playlists',
    columns: {
      id: column('id', 'text'),
      name: column('name', 'text'),
      tracks: column('tracks', 'json'),
      cover_picture: column('cover_picture', 'json', true),
      created_at: column('created_at', 'number'),
      updated_at: column('updated_at', 'number'),
    },
  },
  media_liked_tracks: {
    table: 'media_liked_tracks',
    columns: {
      id: column('id', 'text'),
      provider: column('provider', 'text'),
      provider_id: column('provider_id', 'text'),
      added_at: column('added_at', 'number'),
    },
  },
  media_pinned_items: {
    table: 'media_pinned_items',
    columns: {
      id: column('id', 'text'),
      collection_item_id: column('collection_item_id', 'text'),
      collection_item_type: column('collection_item_type', 'text'),
      order: column('order', 'number'),
      pinned_at: column('pinned_at', 'number'),
    },
  },
};

export const CREATE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS media_providers (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL,
    settings TEXT NOT NULL,
    options TEXT NOT NULL,
    sync_started_at REAL,
    sync_finished_at REAL
  );

  CREATE TABLE IF NOT EXISTS media_artists (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL UNIQUE,
    sync_timestamp REAL NOT NULL,
    artist_name TEXT NOT NULL,
    artist_feature_picture TEXT,
    extra TEXT
  );
  CREATE INDEX IF NOT EXISTS media_artists_artist_name_idx ON media_artists (artist_name);

  CREATE TABLE IF NOT EXISTS media_albums (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL UNIQUE,
    sync_timestamp REAL NOT NULL,
    album_name TEXT NOT NULL,
    album_artist_id TEXT NOT NULL,
    album_cover_picture TEXT,
    extra TEXT
  );
  CREATE INDEX IF NOT EXISTS media_albums_album_name_idx ON media_albums (album_name);
  CREATE INDEX IF NOT EXISTS media_albums_album_artist_id_idx ON media_albums (album_artist_id);

  CREATE TABLE IF NOT EXISTS media_tracks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL UNIQUE,
    sync_timestamp REAL NOT NULL,
    track_name TEXT NOT NULL,
    track_number REAL NOT NULL,
    track_duration REAL NOT NULL,
    track_cover_picture TEXT,
    track_artist_ids TEXT NOT NULL,
    track_album_id TEXT NOT NULL,
    extra TEXT
  );
  CREATE INDEX IF NOT EXISTS media_tracks_track_name_idx ON media_tracks (track_name);
  CREATE INDEX IF NOT EXISTS media_tracks_track_album_id_idx ON media_tracks (track_album_id);

  CREATE TABLE IF NOT EXISTS media_playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tracks TEXT NOT NULL,
    cover_picture TEXT,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_liked_tracks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    added_at REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS media_liked_tracks_provider_idx
    ON media_liked_tracks (provider, provider_id);

  CREATE TABLE IF NOT EXISTS media_pinned_items (
    id TEXT PRIMARY KEY,
    collection_item_id TEXT NOT NULL,
    collection_item_type TEXT NOT NULL,
    "order" REAL NOT NULL,
    pinned_at REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS media_pinned_items_collection_item_id_idx
    ON media_pinned_items (collection_item_id);

  PRAGMA user_version = 1;
`;
