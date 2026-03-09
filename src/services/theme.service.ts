export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'app_theme_mode';

export class ThemeService {
  static get mode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored || 'auto';
  }

  static initialize(): void {
    this.apply(this.mode);
    // for auto mode, react to system changes
    if (this.mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', () => this.apply('auto'));
    }
  }

  static set(mode: ThemeMode): void {
    localStorage.setItem(STORAGE_KEY, mode);
    this.apply(mode);
  }

  private static apply(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }
}
