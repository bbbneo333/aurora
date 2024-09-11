import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function buildRouteFromMappings(base: string, mappings: Record<string, string>): string {
  // accepts a route in format - /path/to/something/:resourceId
  // where mappings = {resourceId: 'foo'}
  // returns - /path/to/something/foo
  return base.replace(/:(\w*)/g, (...args) => mappings[args[1]]);
}
