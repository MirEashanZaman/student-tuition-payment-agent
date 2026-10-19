import { NextFunction, Request, Response } from 'express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { JwtService } from '../src/auth/jwt.service';
import { ApiRateLimitMiddleware } from '../src/security/api-rate-limit.middleware';

describe('API rate limiting', () => {
  const makeRequest = (path: string, ip: string): Request =>
    ({ path, ip, socket: { remoteAddress: ip } } as Request);

  const makeResponse = () => {
    const response = {
      headers: {} as Record<string, string | number>,
      statusCode: 200,
      body: undefined as unknown,
      setHeader(name: string, value: string | number) {
        this.headers[name] = value;
        return this;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: unknown) {
        this.body = body;
        return this;
      },
    };
    return response as unknown as Response & typeof response;
  };

  it('applies a strict login rate limit per client IP', () => {
    const middleware = new ApiRateLimitMiddleware();
    const request = makeRequest('/api/auth/login', '192.0.2.1');
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      middleware.use(request, response, next);
    }

    middleware.use(request, response, next);

    expect(next).toHaveBeenCalledTimes(5);
    expect(response.statusCode).toBe(429);
    expect(response.headers['Retry-After']).toBeGreaterThan(0);
  });

  describe('Protected agent API routes', () => {
    let app: INestApplication;
    let baseUrl: string;
    let jwtService: JwtService;

    const tokenFor = (studentId: string, role = 'STUDENT', permissionTier = 'EXECUTE') =>
      jwtService.sign({
        sub: `account-${studentId}`,
        studentId,
        studentName: studentId,
        email: `${studentId.toLowerCase()}@example.test`,
        role,
        permissionTier,
      });

    beforeAll(async () => {
      process.env.FORCE_MEMORY_DB = 'true';
      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = module.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          transform: true,
        }),
      );
      await app.listen(0, '127.0.0.1');
      const address = app.getHttpServer().address();
      if (!address || typeof address === 'string') {
        throw new Error('Test API server did not bind to a TCP port.');
      }
      baseUrl = `http://127.0.0.1:${address.port}/api`;
      jwtService = app.get(JwtService);
    });

    afterAll(async () => {
      await app?.close();
      delete process.env.FORCE_MEMORY_DB;
    });

    it('requires a valid JWT to read account data', async () => {
      const response = await fetch(`${baseUrl}/accounts/STU-2026-BDT01`);
      expect(response.status).toBe(401);
    });

    it('allows a student to read their own account', async () => {
      const response = await fetch(`${baseUrl}/accounts/STU-2026-BDT01`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(200);
    });

    it('prevents a student from reading another student account', async () => {
      const response = await fetch(`${baseUrl}/accounts/STU-2026-BDT01`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-OTHER')}` },
      });
      expect(response.status).toBe(403);
    });

    it('does not let student tokens mutate account limits', async () => {
      const response = await fetch(`${baseUrl}/accounts/STU-2026-BDT01/limits`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dailyLimitBdt: 100000000 }),
      });
      expect(response.status).toBe(403);
    });

    it('prevents access to another student transfer records by transfer ID', async () => {
      const createResponse = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'University of Toronto',
        }),
      });
      expect(createResponse.status).toBe(201);
      const draft = await createResponse.json();

      const readResponse = await fetch(`${baseUrl}/transfers/${draft.transferId}`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-OTHER')}` },
      });
      expect(readResponse.status).toBe(403);
    });

    it('returns only the authenticated student account audit records', async () => {
      const database = app.get(DatabaseService);
      const account = await database.getAccountByStudentId('STU-2026-BDT01');
      await database.insertAuditLog({
        id: 'audit-owned',
        event_type: 'TEST_EVENT',
        permission_tier: 'READ_ONLY',
        account_id: account!.id,
        action_summary: 'Owned audit entry',
        status: 'SUCCESS',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });
      await database.insertAuditLog({
        id: 'audit-other',
        event_type: 'TEST_EVENT',
        permission_tier: 'READ_ONLY',
        account_id: 'another-account',
        action_summary: 'Other audit entry',
        status: 'SUCCESS',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });

      const response = await fetch(`${baseUrl}/audit`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      const logs = await response.json();
      expect(response.status).toBe(200);
      expect(logs.map((log: { id: string }) => log.id)).toContain('audit-owned');
      expect(logs.map((log: { id: string }) => log.id)).not.toContain('audit-other');
    });

    it('enforces READ_ONLY permission tier by blocking transfer draft creation', async () => {
      const readOnlyToken = tokenFor('STU-2026-BDT01', 'STUDENT', 'READ_ONLY');
      const accountRes = await fetch(`${baseUrl}/accounts/STU-2026-BDT01`, {
        headers: { Authorization: `Bearer ${readOnlyToken}` },
      });
      expect(accountRes.status).toBe(200);

      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOnlyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'University of Toronto',
        }),
      });
      expect(draftRes.status).toBe(403);
    });

    it('enforces DRAFT permission tier by allowing drafting but blocking transfer confirmation', async () => {
      const draftToken = tokenFor('STU-2026-BDT01', 'STUDENT', 'DRAFT');
      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${draftToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'University of Toronto',
        }),
      });
      expect(draftRes.status).toBe(201);
      const draft = await draftRes.json();

      const confirmRes = await fetch(`${baseUrl}/transfers/${draft.transferId}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${draftToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationToken: draft.confirmationToken,
          userConsent: true,
        }),
      });
      expect(confirmRes.status).toBe(403);
    });

    it('prevents a student from querying another student transfer list via query parameter', async () => {
      const response = await fetch(`${baseUrl}/transfers?studentId=STU-OTHER`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(403);
    });

    it('allows a student to read their own account using the me alias', async () => {
      const response = await fetch(`${baseUrl}/accounts/me`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.studentId).toBe('STU-2026-BDT01');
    });

    it('ensures getTransfers returns only the authenticated student transfers', async () => {
      const response = await fetch(`${baseUrl}/transfers`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(200);
      const list = await response.json();
      expect(Array.isArray(list)).toBe(true);
      for (const t of list) {
        expect(t.student_id).toBe('STU-2026-BDT01');
      }
    });

    it('blocks sandbox administration and demo credentials in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const resetResponse = await fetch(`${baseUrl}/sandbox/reset`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenFor('STU-ADMIN', 'ADMIN')}` },
        });
        const credentialsResponse = await fetch(`${baseUrl}/auth/demo-credentials`);
        expect(resetResponse.status).toBe(403);
        expect(credentialsResponse.status).toBe(404);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('rejects production startup without a JWT secret or database URL', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalJwtSecret = process.env.JWT_SECRET;
      const originalDatabaseUrl = process.env.DATABASE_URL;
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;
      try {
        expect(() => new JwtService()).toThrow('JWT_SECRET');
        await expect(new DatabaseService().onModuleInit()).rejects.toThrow('DATABASE_URL');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        if (originalJwtSecret === undefined) {
          delete process.env.JWT_SECRET;
        } else {
          process.env.JWT_SECRET = originalJwtSecret;
        }
        if (originalDatabaseUrl === undefined) {
          delete process.env.DATABASE_URL;
        } else {
          process.env.DATABASE_URL = originalDatabaseUrl;
        }
      }
    });

    it('blocks classic bash fork bomb attacks with HTTP 403 Forbidden', async () => {
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: ':(){ :|:& };:' }),
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('Security Shield Alert');
      expect(data.threatType).toBe('SHELL_BOMB');

      const winResponse = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '%0|%0' }),
      });
      expect(winResponse.status).toBe(403);
      const winData = await winResponse.json();
      expect(winData.threatType).toBe('SHELL_BOMB');
    });

    it('blocks command injection and shell execution attacks', async () => {
      const attackVectors = [
        '; rm -rf /',
        '$(whoami)',
        '`whoami`',
        'cat /etc/passwd',
        'powershell -enc aW52b2tlLWV4cHJlc3Npb24=',
        '<script>alert(document.cookie)</script>',
        '<img src=x onerror=alert(1)>',
      ];
      for (const vector of attackVectors) {
        const response = await fetch(`${baseUrl}/chat`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: vector }),
        });
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.message).toContain('Security Shield Alert');
      }
    });

    it('blocks path traversal attacks in URL query and path parameters', async () => {
      const response = await fetch(`${baseUrl}/transfers/..%2f..%2fetc%2fpasswd`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('Security Shield Alert');
    });

    it('blocks SQL injection attack vectors in request payloads', async () => {
      const response = await fetch(`${baseUrl}/transfers?status=' UNION ALL SELECT * FROM accounts--`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('Security Shield Alert');
      expect(data.threatType).toBe('SQL_INJECTION');

      const panResponse = await fetch(`${baseUrl}/transfers?pan=4111222233334444`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(panResponse.status).toBe(403);
      const panData = await panResponse.json();
      expect(panData.threatType).toBe('PAN_ATTACK_DETECTED');
    });

    it('blocks prototype pollution payload attempts', async () => {
      const response = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: '{"routeId":"route-edupay-prime","amountUsd":100,"recipientUniversity":"University of Oxford","__proto__":{"isAdmin":true}}',
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.threatType).toBe('PROTOTYPE_POLLUTION');
    });

    it('blocks null byte poisoning attacks in URL and payloads', async () => {
      const response = await fetch(`${baseUrl}/transfers/TR-123%00.txt`, {
        headers: { Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}` },
      });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.threatType).toBe('NULL_BYTE_POISONING');
    });

    it('executes a complete rollback on confirmed transfers, restoring balance and daily spent quota', async () => {
      const database = app.get(DatabaseService);
      const initialAccount = await database.getAccountByStudentId('STU-2026-BDT01');
      const startBalance = initialAccount!.balance;
      const startDailySpent = initialAccount!.daily_spent;

      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'Monash University Malaysia',
        }),
      });
      expect(draftRes.status).toBe(201);
      const draft = await draftRes.json();

      const confirmRes = await fetch(`${baseUrl}/transfers/${draft.transferId}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationToken: draft.confirmationToken,
          userConsent: true,
        }),
      });
      expect(confirmRes.status).toBe(201);

      const confirmedAccount = await database.getAccountByStudentId('STU-2026-BDT01');
      expect(confirmedAccount!.balance).toBeLessThan(startBalance);

      const rollbackRes = await fetch(`${baseUrl}/transfers/${draft.transferId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Accidental double payment' }),
      });
      expect(rollbackRes.status).toBe(201);
      const rollbackData = await rollbackRes.json();
      expect(rollbackData.success).toBe(true);
      expect(rollbackData.status).toBe('ROLLED_BACK');
      expect(rollbackData.restoredAmountBdt).toBeGreaterThan(0);

      const restoredAccount = await database.getAccountByStudentId('STU-2026-BDT01');
      expect(restoredAccount!.balance).toBe(startBalance);
      expect(restoredAccount!.daily_spent).toBe(startDailySpent);

      const updatedTx = await database.getTransferById(draft.transferId);
      expect(updatedTx!.status).toBe('ROLLED_BACK');
    });

    it('rolls back draft transfers by safely cancelling them without moving funds', async () => {
      const database = app.get(DatabaseService);
      const initialAccount = await database.getAccountByStudentId('STU-2026-BDT01');
      const startBalance = initialAccount!.balance;

      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'University of Melbourne',
        }),
      });
      expect(draftRes.status).toBe(201);
      const draft = await draftRes.json();

      const rollbackRes = await fetch(`${baseUrl}/transfers/${draft.transferId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Changed mind before confirm' }),
      });
      expect(rollbackRes.status).toBe(201);
      const rollbackData = await rollbackRes.json();
      expect(rollbackData.success).toBe(true);
      expect(rollbackData.status).toBe('CANCELLED');

      const afterAccount = await database.getAccountByStudentId('STU-2026-BDT01');
      expect(afterAccount!.balance).toBe(startBalance);
    });

    it('prevents cross-student unauthorized rollback of another student transfer', async () => {
      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'University of Sydney',
        }),
      });
      const draft = await draftRes.json();

      const rollbackRes = await fetch(`${baseUrl}/transfers/${draft.transferId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-OTHER')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Malicious rollback attempt' }),
      });
      expect(rollbackRes.status).toBe(403);
    });

    it('rejects duplicate rollback on an already rolled-back transfer', async () => {
      const draftRes = await fetch(`${baseUrl}/transfers/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: 'route-edupay-prime',
          amountUsd: 100,
          recipientUniversity: 'National University of Singapore',
        }),
      });
      const draft = await draftRes.json();

      await fetch(`${baseUrl}/transfers/${draft.transferId}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationToken: draft.confirmationToken,
          userConsent: true,
        }),
      });

      const firstRollback = await fetch(`${baseUrl}/transfers/${draft.transferId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Initial rollback' }),
      });
      expect(firstRollback.status).toBe(201);

      const secondRollback = await fetch(`${baseUrl}/transfers/${draft.transferId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenFor('STU-2026-BDT01')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Duplicate rollback' }),
      });
      expect(secondRollback.status).toBe(400);
    });
  });

  it('applies an independent higher rate limit to chat requests', () => {
    const middleware = new ApiRateLimitMiddleware();
    const request = makeRequest('/api/chat', '192.0.2.2');
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      middleware.use(request, response, next);
    }

    middleware.use(request, response, next);

    expect(next).toHaveBeenCalledTimes(20);
    expect(response.statusCode).toBe(429);
  });

  it('does not throttle non-API routes', () => {
    const middleware = new ApiRateLimitMiddleware();
    const response = makeResponse();
    const next = jest.fn() as NextFunction;

    middleware.use(makeRequest('/health', '192.0.2.3'), response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
  });
});
