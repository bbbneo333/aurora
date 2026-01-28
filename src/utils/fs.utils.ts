import fs from 'fs';

export function isFile(path: string) {
  try {
    const stat = fs.statSync(path);
    return stat.isFile();
  } catch {
    return false;
  }
}
