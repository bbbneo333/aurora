export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessed: number;
};
