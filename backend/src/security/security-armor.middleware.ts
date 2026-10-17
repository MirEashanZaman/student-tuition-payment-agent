import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

interface ThreatDetectionResult {
  detected: boolean;
  threatType?: string;
  matchedPattern?: string;
}

@Injectable()
export class SecurityArmorMiddleware implements NestMiddleware {
  constructor(private readonly db?: DatabaseService) {}

  private readonly shellBombPatterns: RegExp[] = [
    /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    /bomb\s*\(\s*\)\s*\{\s*bomb\s*\|\s*bomb\s*&\s*\}\s*;\s*bomb/i,
    /perl\s+-e\s+['"].*fork.*fork/i,
    /python(?:\d)?\s+-c\s+['"].*os\.fork/i,
    /ruby\s+-e\s+['"].*loop\s*\{\s*fork/i,
  ];

  private readonly commandInjectionPatterns: RegExp[] = [
    /(?:^|[;&|`$])\s*(?:rm\s+-[rf]+|shutdown\b|reboot\b|mkfifo\b|nc\s+-[el]|cat\s+\/etc\/(?:passwd|shadow|hosts)|bash\s+-c|sh\s+-c)/i,
    /\$\((?:whoami|id|uname|cat|ls|pwd|curl|wget)\b/i,
    /`(?:whoami|id|uname|cat|ls|pwd|rm|curl|wget)\b/i,
    /(?:curl|wget)\s+[^|\n\r]+?\|\s*(?:ba)?sh/i,
    /powershell(?:\.exe)?\s+(?:-[a-zA-Z]+\s+)*(?:iex|invoke-expression|downloadstring)/i,
    /cmd(?:\.exe)?\s+\/c\s+/i,
  ];

  private readonly pathTraversalPatterns: RegExp[] = [
    /(?:\.\.[\/\\]|%2e%2e[\/\\]|%2e%2e%2f|%252e%252e)/i,
    /(?:\/etc\/(?:passwd|shadow|hosts)|\/proc\/self\/environ|c:\\windows\\system32)/i,
  ];

  private readonly sqlInjectionPatterns: RegExp[] = [
    /\bunion\s+(?:all\s+)?select\b/i,
    /;\s*drop\s+table\b/i,
    /;\s*truncate\s+table\b/i,
    /'\s+or\s+['\d]=['\d]/i,
    /;\s*exec\s+xp_cmdshell\b/i,
  ];

  use(request: Request, response: Response, next: NextFunction): void {
    const threat = this.scanRequest(request);
    if (threat.detected) {
      this.recordThreat(request, threat);
      response.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Security Shield Alert: Request blocked due to malicious signature (shell bombing / penetration vector detected).',
        threatType: threat.threatType,
      });
      return;
    }
    next();
  }

  private scanRequest(request: Request): ThreatDetectionResult {
    const rawUrl = request.originalUrl || request.url || '';
    if (rawUrl) {
      const rawCheck = this.inspectString(rawUrl);
      if (rawCheck.detected) return rawCheck;

      try {
        const decoded = decodeURIComponent(rawUrl);
        const decodedCheck = this.inspectString(decoded);
        if (decodedCheck.detected) return decodedCheck;
      } catch {
        return {
          detected: true,
          threatType: 'MALFORMED_URI_ATTACK',
          matchedPattern: 'URIError on decodeURIComponent',
        };
      }
    }

    if (request.query && typeof request.query === 'object') {
      const queryCheck = this.inspect(request.query);
      if (queryCheck.detected) return queryCheck;
    }

    if (request.params && typeof request.params === 'object') {
      const paramsCheck = this.inspect(request.params);
      if (paramsCheck.detected) return paramsCheck;
    }

    if (request.headers && typeof request.headers === 'object') {
      for (const [key, value] of Object.entries(request.headers)) {
        if (key.toLowerCase() === 'authorization' && typeof value === 'string' && value.startsWith('Bearer ')) {
          continue;
        }
        const headerCheck = this.inspect(value);
        if (headerCheck.detected) return headerCheck;
      }
    }

    if (request.body && typeof request.body === 'object') {
      const bodyCheck = this.inspect(request.body);
      if (bodyCheck.detected) return bodyCheck;
    }

    return { detected: false };
  }

  private inspect(value: unknown, depth = 0): ThreatDetectionResult {
    if (depth > 10) {
      return {
        detected: true,
        threatType: 'PAYLOAD_BOMB_DEEP_NESTING',
        matchedPattern: 'Max nesting depth exceeded (>10)',
      };
    }

    if (value === null || value === undefined) {
      return { detected: false };
    }

    if (typeof value === 'string') {
      return this.inspectString(value);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = this.inspect(item, depth + 1);
        if (result.detected) return result;
      }
      return { detected: false };
    }

    if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return {
            detected: true,
            threatType: 'PROTOTYPE_POLLUTION',
            matchedPattern: key,
          };
        }
        const keyCheck = this.inspectString(key);
        if (keyCheck.detected) return keyCheck;

        const val = (value as Record<string, unknown>)[key];
        const valCheck = this.inspect(val, depth + 1);
        if (valCheck.detected) return valCheck;
      }
    }

    return { detected: false };
  }

  private inspectString(text: string): ThreatDetectionResult {
    if (text.includes('\0') || text.includes('%00')) {
      return {
        detected: true,
        threatType: 'NULL_BYTE_POISONING',
        matchedPattern: 'Null byte detected',
      };
    }

    for (const pattern of this.shellBombPatterns) {
      if (pattern.test(text)) {
        return {
          detected: true,
          threatType: 'SHELL_BOMB',
          matchedPattern: pattern.source,
        };
      }
    }

    for (const pattern of this.commandInjectionPatterns) {
      if (pattern.test(text)) {
        return {
          detected: true,
          threatType: 'COMMAND_INJECTION',
          matchedPattern: pattern.source,
        };
      }
    }

    for (const pattern of this.pathTraversalPatterns) {
      if (pattern.test(text)) {
        return {
          detected: true,
          threatType: 'PATH_TRAVERSAL',
          matchedPattern: pattern.source,
        };
      }
    }

    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(text)) {
        return {
          detected: true,
          threatType: 'SQL_INJECTION',
          matchedPattern: pattern.source,
        };
      }
    }

    return { detected: false };
  }

  private recordThreat(request: Request, threat: ThreatDetectionResult): void {
    if (!this.db) return;
    const ip = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const path = request.originalUrl || request.url || 'unknown';
    this.db
      .insertAuditLog({
        id: uuidv4(),
        event_type: 'PENETRATION_ATTACK_BLOCKED',
        permission_tier: 'READ_ONLY',
        action_summary: `Security Armor blocked ${threat.threatType} on ${path}`,
        details: JSON.stringify({
          threatType: threat.threatType,
          matchedPattern: threat.matchedPattern,
          method: request.method,
          path,
          ip,
        }),
        status: 'BLOCKED',
        ip_address: ip,
        created_at: new Date(),
      })
      .catch(() => {});
  }
}
