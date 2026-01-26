import worker from './vibrant.worker';

// TODO: Add support for worker
// import * as Comlink from 'comlink';

// const worker = Comlink.wrap(new Worker(
//   new URL('./vibrant.worker.ts', window.location.href),
//   { type: 'module' },
// ));

export class VibrantService {
  static getColors(imagePath: string) {
    return worker.getColors(imagePath);
  }
}
