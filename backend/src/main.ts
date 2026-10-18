import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { ApiRateLimitMiddleware } from './security/api-rate-limit.middleware';
import { SecurityArmorMiddleware } from './security/security-armor.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  const server = app.getHttpAdapter().getInstance();
  const apiRateLimiter = new ApiRateLimitMiddleware();
  const securityArmor = app.get(SecurityArmorMiddleware);
  server.disable('x-powered-by');
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:4567,http://127.0.0.1:4567')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has('*') || allowedOrigins.has(origin)),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(securityArmor.use.bind(securityArmor));
  app.use(apiRateLimiter.use.bind(apiRateLimiter));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4568;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`================================================================`);
  logger.log(` FinTechathon 2026: Student Tuition Payment Agent Backend       `);
  logger.log(` Server is listening at http://${host}:${port}                  `);
  logger.log(` Health check: http://${host}:${port}/api/rates                 `);
  logger.log(` Chat API: http://${host}:${port}/api/chat                      `);
  logger.log(`================================================================`);
}

bootstrap();
