// TODO: Add support for worker
// import * as Comlink from 'comlink';

import { Vibrant } from 'node-vibrant/browser';

class VibrantWorker {
  async getColors(imagePath: string): Promise<string[]> {
    const palette = await Vibrant.from(imagePath).getPalette();

    const swatches = [
      palette.Vibrant,
      palette.LightVibrant,
      palette.Muted,
      palette.DarkVibrant,
    ].filter(Boolean);

    const useful = swatches
      .map(s => s!.hex)
      .slice(0, 3);

    return useful.slice(0, 3);
  }
}

// Comlink.expose(new VibrantWorker());

export default new VibrantWorker();
