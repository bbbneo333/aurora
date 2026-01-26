import Vibrant from './vibrant.worker';

export class VibrantService {
  static async getColors(imagePath: string) {
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
