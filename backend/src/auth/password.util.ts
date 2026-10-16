import * as crypto from 'crypto';

export class PasswordHasher {
  /**
   * Hashes a password using Node.js built-in scrypt with a unique random 16-byte salt.
   * Format: <salt-hex>:<key-hex>
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Timing-safe verification of a plain password against the stored salt:hash string.
   */
  static verifyPassword(password: string, storedHash?: string | null): boolean {
    if (!storedHash || !storedHash.includes(':')) {
      return false;
    }
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== derivedKey.length) {
        return false;
      }
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }
}
