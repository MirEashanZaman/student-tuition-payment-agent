import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`================================================================`);
  logger.log(` FinTechathon 2026: Student Tuition Payment Agent Backend       `);
  logger.log(` Server is listening at http://localhost:${port}                `);
  logger.log(` Health check: http://localhost:${port}/api/rates               `);
  logger.log(` Chat API: http://localhost:${port}/api/chat                    `);
  logger.log(`================================================================`);
}

bootstrap();
