import {v4 as uuidv4} from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function buildFromMappings(base: string, mappings: Record<string, string>): string {
  return base.replace(/{(\w*)}/g, (...args) => mappings[args[1]]);
}
