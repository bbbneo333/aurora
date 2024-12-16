type DataStoreComparisonOperators<T> = {
  $lt?: T;
  $lte?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $nin?: T[];
  $ne?: T;
  $exists?: boolean;
  $regex?: RegExp | string;
};

type DataStoreLogicalOperators<T> = {
  $or?: DataStoreFilterData<T>[];
  $and?: DataStoreFilterData<T>[];
  $not?: DataStoreFilterData<T>;
  $where?: (this: T) => boolean;
};

export type DataStoreFilterData<T> = {
  [P in keyof T]?: T[P] | DataStoreComparisonOperators<T[P]>;
} & DataStoreLogicalOperators<T>;

export type DataStoreSortData<T> = {
  [P in keyof T]?: number
};

export type DataStoreQueryData<T> = {
  filter: DataStoreFilterData<T>,
  sort?: DataStoreSortData<T>,
  skip?: number,
  limit?: number,
};

export type DataStoreInputData<T = any> = Omit<T, 'id'>;

export type DataStoreUpdateData<T = any> = Partial<Omit<T, 'id' | 'created_at'>>;
