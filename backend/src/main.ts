import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { ApiRateLimitMiddleware } from './security/api-rate-limit.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const server = app.getHttpAdapter().getInstance();
  const apiRateLimiter = new ApiRateLimitMiddleware();
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
  app.use(apiRateLimiter.use.bind(apiRateLimiter));
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:4567,http://127.0.0.1:4567')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4568;
  await app.listen(port);
  logger.log(`================================================================`);
  logger.log(` FinTechathon 2026: Student Tuition Payment Agent Backend       `);
  logger.log(` Server is listening at http://localhost:${port}                `);
  logger.log(` Health check: http://localhost:${port}/api/rates               `);
  logger.log(` Chat API: http://localhost:${port}/api/chat                    `);
  logger.log(`================================================================`);
}

bootstrap();
