import fs from 'fs';

export class FileSystemUtils {
  static isFile(path: string) {
    try {
      const stat = fs.statSync(path);
      return stat.isFile();
    } catch {
      return false;
    }
  }
}
