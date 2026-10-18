import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { SecurityArmorMiddleware } from './security/security-armor.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AgentModule,
    AuthModule,
  ],
  providers: [SecurityArmorMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityArmorMiddleware).forRoutes('*');
  }
}

