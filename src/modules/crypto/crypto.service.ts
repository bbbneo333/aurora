import crypto from 'crypto';

export class CryptoService {
  static sha1(...parts: Array<Buffer | string>): string {
    const hash = crypto.createHash('sha1');

    parts.forEach((part) => {
      if (Buffer.isBuffer(part)) hash.update(part);
      else hash.update(part, 'utf8');
    });

    return hash.digest('hex');
  }

  static sha256(...parts: Array<Buffer | string>): string {
    const hash = crypto.createHash('sha256');

    parts.forEach((part) => {
      if (Buffer.isBuffer(part)) hash.update(part);
      else hash.update(part, 'utf8');
    });

    return hash.digest('hex');
  }
}
