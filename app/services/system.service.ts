const {remote} = window.require('electron');
const fs = remote.require('fs');

export class SystemService {
  getFile(path: string) {
    return fs.readFileSync(path, 'utf8');
  }
}
