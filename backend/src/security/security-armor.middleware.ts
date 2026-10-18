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
    /\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    /%0\s*\|\s*%0/,
    /bomb\s*\(\s*\)\s*\{\s*bomb\s*\|\s*bomb\s*&\s*\}\s*;\s*bomb/i,
    /perl\s+-e\s+['"].*fork.*fork/i,
    /python(?:\d)?\s+-c\s+['"].*os\.fork/i,
    /ruby\s+-e\s+['"].*loop\s*\{\s*fork/i,
    /(?:child_process|process)\s*\.\s*(?:fork|spawn|exec|abort)/i,
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /\bwhile\s*\(\s*(?:true|1)\s*\)\s*\{\s*fork\s*\(\s*\)\s*;\s*\}/i,
  ];

  private readonly commandInjectionPatterns: RegExp[] = [
    /(?:^|[;&|`$])\s*(?:rm\s+-[rf]+|shutdown\b|reboot\b|mkfifo\b|nc\s+-[el]|cat\s+\/etc\/(?:passwd|shadow|hosts)|bash\s+-c|sh\s+-c)/i,
    /\$\((?:whoami|id|uname|cat|ls|pwd|curl|wget)\b/i,
    /`(?:whoami|id|uname|cat|ls|pwd|rm|curl|wget)\b/i,
    /(?:curl|wget)\s+[^|\n\r]+?\|\s*(?:ba)?sh/i,
    /(?:powershell|pwsh)(?:\.exe)?\b/i,
    /(?:^|[;&|`$])\s*cmd(?:\.exe)?\s+\/c/i,
    /(?:^|[;&|`$])\s*(?:chmod\s+[0-7]{3,4}|chown\b|kill\s+-[0-9]+|pkill\b|killall\b)/i,
  ];

  private readonly pathTraversalPatterns: RegExp[] = [
    /(?:\.\.[\/\\]|\.\.%2f|\.\.%252f|%2e%2e[\/\\]|%2e%2e%2f|%252e%252e|%252e%2f)/i,
    /(?:\/etc\/(?:passwd|shadow|hosts)|\/proc\/self\/environ|c:\\windows\\system32)/i,
  ];

  private readonly sqlInjectionPatterns: RegExp[] = [
    /\bunion\s+(?:all\s+)?select\b/i,
    /;\s*drop\s+table\b/i,
    /;\s*truncate\s+table\b/i,
    /'\s+or\s+['\d]=['\d]/i,
    /;\s*exec\s+xp_cmdshell\b/i,
  ];

  private readonly xssPatterns: RegExp[] = [
    /<script\b[^>]*>[\s\S]*?<\/script>/i,
    /<script\b[^>]*>/i,
    /javascript\s*:\s*[^\s]/i,
    /data\s*:\s*text\/html/i,
    /vbscript\s*:/i,
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /<svg\b[^>]*\bon[a-z]+\s*=/i,
    /<img\b[^>]*\bon[a-z]+\s*=/i,
    /<body\b[^>]*\bon[a-z]+\s*=/i,
    /\bon(?:error|load|click|mouseover|focus|blur|submit|keydown|keyup)\s*=\s*['"][^'"]*['"]/i,
    /(?:document|window)\s*\.\s*(?:cookie|location|write)\b/i,
  ];

  private readonly panPatterns: RegExp[] = [
    /\b4[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{1,4}\b/,
    /\b5[1-5][0-9]{2}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/,
    /\b2(?:2[2-9][0-9]{2}|[3-6][0-9]{3}|7[0-1][0-9]{2}|720[0-9])[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{2}\b/,
    /\b3[47][0-9]{2}[\s-]?[0-9]{6}[\s-]?[0-9]{5}\b/,
    /\b6(?:011|5[0-9]{2})[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/,
  ];

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.method === 'OPTIONS' || (request as any).__securityArmorChecked) {
      next();
      return;
    }
    (request as any).__securityArmorChecked = true;
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
    const isDepositRoute = /\/accounts\/[^\/]+\/(?:card-deposit|deposit)/i.test(rawUrl);

    if (rawUrl) {
      const rawCheck = this.inspectString(rawUrl, true);
      if (rawCheck.detected) return rawCheck;

      let current = rawUrl;
      for (let i = 0; i < 3; i += 1) {
        try {
          const decoded = decodeURIComponent(current);
          if (decoded === current) break;
          current = decoded;
          const decodedCheck = this.inspectString(current, true);
          if (decodedCheck.detected) return decodedCheck;
        } catch {
          return {
            detected: true,
            threatType: 'MALFORMED_URI_ATTACK',
            matchedPattern: 'URIError on decodeURIComponent',
          };
        }
      }
    }

    if (request.query && typeof request.query === 'object') {
      const queryCheck = this.inspect(request.query, 0, true);
      if (queryCheck.detected) return queryCheck;
    }

    if (request.params && typeof request.params === 'object') {
      const paramsCheck = this.inspect(request.params, 0, true);
      if (paramsCheck.detected) return paramsCheck;
    }

    if (request.headers && typeof request.headers === 'object') {
      const safeHeaders = new Set([
        'authorization',
        'host',
        'origin',
        'referer',
        'user-agent',
        'accept',
        'accept-encoding',
        'accept-language',
        'connection',
        'content-type',
        'content-length',
        'sec-ch-ua',
        'sec-ch-ua-mobile',
        'sec-ch-ua-platform',
        'sec-fetch-dest',
        'sec-fetch-mode',
        'sec-fetch-site',
        'if-none-match',
        'cookie',
      ]);
      for (const [key, value] of Object.entries(request.headers)) {
        if (safeHeaders.has(key.toLowerCase())) {
          continue;
        }
        const headerCheck = this.inspect(value, 0, true);
        if (headerCheck.detected) return headerCheck;
      }
    }

    if (request.body && typeof request.body === 'object') {
      const bodyCheck = this.inspect(request.body, 0, !isDepositRoute);
      if (bodyCheck.detected) return bodyCheck;
    }

    return { detected: false };
  }

  private inspect(value: unknown, depth = 0, checkPan = false): ThreatDetectionResult {
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
      return this.inspectString(value, checkPan);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = this.inspect(item, depth + 1, checkPan);
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
        const keyCheck = this.inspectString(key, checkPan);
        if (keyCheck.detected) return keyCheck;

        const val = (value as Record<string, unknown>)[key];
        const valCheck = this.inspect(val, depth + 1, checkPan);
        if (valCheck.detected) return valCheck;
      }
    }

    return { detected: false };
  }

  private inspectString(text: string, checkPan = false): ThreatDetectionResult {
    if (text.includes('\0') || text.includes('%00')) {
      return {
        detected: true,
        threatType: 'NULL_BYTE_POISONING',
        matchedPattern: 'Null byte detected',
      };
    }

    const checkPatterns = (str: string): ThreatDetectionResult => {
      for (const pattern of this.shellBombPatterns) {
        if (pattern.test(str)) {
          return {
            detected: true,
            threatType: 'SHELL_BOMB',
            matchedPattern: pattern.source,
          };
        }
      }

      for (const pattern of this.commandInjectionPatterns) {
        if (pattern.test(str)) {
          return {
            detected: true,
            threatType: 'COMMAND_INJECTION',
            matchedPattern: pattern.source,
          };
        }
      }

      for (const pattern of this.pathTraversalPatterns) {
        if (pattern.test(str)) {
          return {
            detected: true,
            threatType: 'PATH_TRAVERSAL',
            matchedPattern: pattern.source,
          };
        }
      }

      for (const pattern of this.sqlInjectionPatterns) {
        if (pattern.test(str)) {
          return {
            detected: true,
            threatType: 'SQL_INJECTION',
            matchedPattern: pattern.source,
          };
        }
      }

      for (const pattern of this.xssPatterns) {
        if (pattern.test(str)) {
          return {
            detected: true,
            threatType: 'XSS_INJECTION',
            matchedPattern: pattern.source,
          };
        }
      }

      if (checkPan) {
        for (const pattern of this.panPatterns) {
          if (pattern.test(str)) {
            return {
              detected: true,
              threatType: 'PAN_ATTACK_DETECTED',
              matchedPattern: 'Unmasked Primary Account Number (PAN) pattern matched',
            };
          }
        }
      }

      return { detected: false };
    };

    const direct = checkPatterns(text);
    if (direct.detected) return direct;

    if (text.includes('%')) {
      let cur = text;
      for (let i = 0; i < 3; i += 1) {
        try {
          const dec = decodeURIComponent(cur);
          if (dec === cur) break;
          cur = dec;
          const res = checkPatterns(cur);
          if (res.detected) return res;
        } catch {
          break;
        }
      }
    }

    return { detected: false };
  }

  private recordThreat(request: Request, threat: ThreatDetectionResult): void {
    if (!this.db) return;
    const ip = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const path = request.originalUrl || request.url || 'unknown';
    const user = (request as any).user;
    const accountId = user?.accountId || 'acc-stu-2026-bdt';
    this.db
      .insertAuditLog({
        id: uuidv4(),
        event_type: 'PENETRATION_ATTACK_BLOCKED',
        permission_tier: 'READ_ONLY',
        account_id: accountId,
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
