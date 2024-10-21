export type DataStoreInputData<T = any> = Omit<T, 'id'>;

export type DataStoreFilterData<T = any> = Partial<T>;

export type DataStoreUpdateData<T = any> = Partial<Omit<T, 'id'>>;
