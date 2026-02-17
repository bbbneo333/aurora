import { Vibrant } from 'node-vibrant/node';

import { CacheService } from '../../cache';

export class VibrantModule {
  // generates colors for tinting background based on image provided at path
  async getImageColors(imagePath: string): Promise<string[]> {
    const cacheKey = `vibrant:palette:file:${imagePath}`;
    const cached = await CacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const palette = await Vibrant.from(imagePath).getPalette();

    const swatches = [
      palette.Vibrant,
      palette.LightVibrant,
      palette.DarkVibrant,
      palette.Muted,
      palette.LightMuted,
      palette.DarkMuted,
    ].filter(Boolean).map(s => s!.hex);

    const tint1 = this.mix(
      palette.Vibrant!.hex,
      palette.LightVibrant?.hex ?? palette.Muted!.hex,
      0.4,
    );

    const tint2 = this.mix(
      palette.DarkVibrant?.hex ?? palette.DarkMuted!.hex,
      palette.Muted!.hex,
      0.6,
    );

    let ambient = swatches[0];
    swatches.forEach((swatch) => {
      ambient = this.mix(ambient, swatch, 0.25);
    });

    const colors = [tint1, tint2, ambient];
    await CacheService.set(cacheKey, colors);

    return colors;
  }

  private hexToRgb(hex: string) {
    const v = hex.replace('#', '');

    return {
      r: parseInt(v.substring(0, 2), 16),
      g: parseInt(v.substring(2, 4), 16),
      b: parseInt(v.substring(4, 6), 16),
    };
  }

  private rgbToHex(r: number, g: number, b: number) {
    return (
      `#${
        [r, g, b]
          .map(x => x.toString(16).padStart(2, '0'))
          .join('')}`
    );
  }

  private mix(hexA: string, hexB: string, weight = 0.5) {
    const a = this.hexToRgb(hexA);
    const b = this.hexToRgb(hexB);

    const r = Math.round(a.r * (1 - weight) + b.r * weight);
    const g = Math.round(a.g * (1 - weight) + b.g * weight);
    const bC = Math.round(a.b * (1 - weight) + b.b * weight);

    return this.rgbToHex(r, g, bC);
  }
}
