import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  studentId: string;
  studentName: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export interface DecodedToken {
  header: { alg: string; typ: string };
  payload: JwtPayload;
  signature: string;
}

@Injectable()
export class JwtService {
  private readonly defaultSecret =
    process.env.JWT_SECRET || 'fintechathon-2026-sandbox-secret-jwt-key-bdt';
  private readonly defaultExpiresInSeconds = 86400; // 24 hours

  private base64UrlEncode(input: string | Buffer): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(input: string): string {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  /**
   * Signs a JWT payload with HMAC-SHA256.
   */
  sign(payload: JwtPayload, expiresInSeconds = this.defaultExpiresInSeconds): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const enrichedPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(enrichedPayload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', this.defaultSecret)
      .update(dataToSign)
      .digest();
    const encodedSignature = this.base64UrlEncode(signature);

    return `${dataToSign}.${encodedSignature}`;
  }

  /**
   * Verifies and returns the validated payload of a JWT.
   * Throws UnauthorizedException if expired, malformed, or signature does not match.
   */
  verify(token: string): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Authentication token is missing or invalid.');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed JWT token structure.');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.defaultSecret)
      .update(dataToSign)
      .digest();
    const expectedEncodedSignature = this.base64UrlEncode(expectedSignature);

    // Timing-safe check of signatures
    const sigBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedEncodedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid JWT signature.');
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch {
      throw new UnauthorizedException('Failed to decode JWT payload.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('JWT session token has expired. Please log in again.');
    }

    return payload;
  }

  /**
   * Safely decodes a JWT token without verifying signature (useful for inspection/debugging).
   */
  decode(token: string): DecodedToken | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      return {
        header,
        payload,
        signature: parts[2],
      };
    } catch {
      return null;
    }
  }
}
