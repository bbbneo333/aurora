export function buildFromMappings(base: string, mappings: Record<string, string>): string {
  return base.replace(/{(\w*)}/g, (...args) => mappings[args[1]]);
}
