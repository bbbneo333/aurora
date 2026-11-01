export type DatastoreIndex = {
  field: string,
  unique?: boolean,
};

export type DatastoreOptions = {
  indexes?: DatastoreIndex[]
};

export enum DatastoreOperation {
  SearchByName = 'search_by_name',
  FindByIds = 'find_by_ids',
  FindTracksByArtistId = 'find_tracks_by_artist_id',
  AddPlaylistTracks = 'add_playlist_tracks',
  RemovePlaylistTracks = 'remove_playlist_tracks',
}

export type DataStoreComparisonOperators<T> = {
  $lt?: T;
  $lte?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $ne?: T;
};

type DataStoreScalar = string | number | boolean | null;
type DataStoreFilterValue<T> = Exclude<T, undefined> extends DataStoreScalar
  ? Exclude<T, undefined> | DataStoreComparisonOperators<Exclude<T, undefined>>
  : never;

export type DataStoreFilterData<T = any> = {
  [P in keyof T]?: DataStoreFilterValue<T[P]>;
};

export type DataStoreSortData<T> = {
  [P in keyof T]?: Exclude<T[P], undefined> extends DataStoreScalar ? 1 | -1 : never
};

export type DataStoreQueryData<T = any> = {
  filter: DataStoreFilterData<T>,
  sort?: DataStoreSortData<T>,
  skip?: number,
  limit?: number,
};

export type DataStoreInputData<T = any> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

export type DataStoreUpdateData<T = any> = Partial<Omit<T, 'id' | 'created_at'>>;
