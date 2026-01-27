import crypto from 'crypto';

export class CryptoService {
  static generateSHA256Hash(data: string): string {
    return crypto.createHash('sha256')
      .update(data)
      .digest()
      .toString('hex');
  }

  static generateSHA1Hash(buffer: Buffer): string {
    return crypto.createHash('sha1')
      .update(buffer)
      .digest('hex');
  }
}
