export {};

declare global {
  interface Window {
    app: {
      env: string,
      port: number,
      versions: {
        chrome: string,
      },
    };
  }
}
