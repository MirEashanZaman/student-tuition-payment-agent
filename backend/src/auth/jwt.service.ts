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
  private readonly defaultSecret = this.getSigningSecret();
  private readonly defaultExpiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '', 10) || 86400;

  private getSigningSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (
      process.env.NODE_ENV === 'production' &&
      (!secret ||
        secret.length < 32 ||
        secret === 'fintechathon-2026-sandbox-secret-jwt-key-bdt')
    ) {
      throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
    }
    return secret || 'fintechathon-2026-sandbox-secret-jwt-key-bdt';
  }

  private base64UrlEncode(input: string | Buffer): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
    return buf.toString('base64url');
  }

  private base64UrlDecode(input: string): string {
    return Buffer.from(input, 'base64url').toString('utf8');
  }

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

    const sigBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedEncodedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid JWT signature.');
    }

    let header: { alg?: string; typ?: string };
    try {
      header = JSON.parse(this.base64UrlDecode(encodedHeader));
    } catch {
      throw new UnauthorizedException('Failed to decode JWT header.');
    }
    if (header.alg !== 'HS256') {
      throw new UnauthorizedException('Unsupported JWT algorithm.');
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
