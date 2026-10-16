import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, JwtService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
