import { v4 as uuidv4 } from 'uuid';
import { forEach, get, isEmpty } from 'lodash';

export function generateId(): string {
  return uuidv4();
}

export function buildRoute(
  base: string,
  mappings?: Record<string, string>,
  query?: Record<string, string>,
): string {
  // build path from provided mappings
  // example: /search/:category, mappings: { category: "books" }
  // builds: /search/books
  // empty value for a mapping will throw error
  const path = base.replace(/:(\w*)/g, (...args) => {
    const key = args[1];
    const mapping = get(mappings, key);
    if (!mapping) {
      throw new Error(`Could not build route - Unknown mapping for key ${key}`);
    }

    return mapping;
  });

  // build query string if query was provided
  // example: /search/:category, mappings: { category: "books" }, query: { q: "react", page: 2 }
  // builds: /search/books?q=react&page=2
  if (!isEmpty(query)) {
    const params = new URLSearchParams();

    forEach(query, (value, key) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return `${path}?${params.toString()}`;
  }

  return path;
}

export function buildLink(
  base: string,
  mappings?: Record<string, string>,
): string {
  return base.replace(/\{(\w*)\}/g, (...args) => {
    const key = args[1];
    const mapping = get(mappings, key);
    if (!mapping) {
      throw new Error(`Could not build link - Unknown mapping for key ${key}`);
    }

    return mapping;
  });
}
