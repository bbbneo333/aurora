import { MemoryStore } from './stores/memory';
import { CacheEntry } from './types';

const debug = require('debug')('aurora:service:cache');

export class CacheService {
  private static readonly store = new MemoryStore<string, CacheEntry<any>>();

  private static MAX_SIZE = 500;
  private static TTL_MS = 1000 * 60 * 30; // 30 minutes

  static async get<T = any>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);

    if (!entry) return undefined;

    // expire check
    if (Date.now() > entry.expiresAt) {
      debug('get: entry expired - %s', key);
      this.store.delete(key);
      return undefined;
    }

    debug('get: cache hit - %s', key);

    // update LRU access
    entry.lastAccessed = Date.now();
    this.store.set(key, entry);

    return entry.value;
  }

  static async set<T = any>(key: string, value: T): Promise<void> {
    const now = Date.now();

    this.store.set(key, {
      value,
      expiresAt: now + this.TTL_MS,
      lastAccessed: now,
    });

    debug('set: cache updated - %s', key);

    this.evictIfNeeded();
  }

  private static evictIfNeeded() {
    if (this.store.size <= this.MAX_SIZE) return;

    // find least recently used
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, entry] of this.store) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      debug('set: cache evicting - %s', oldestKey);
      this.store.delete(oldestKey);
    }
  }
}
