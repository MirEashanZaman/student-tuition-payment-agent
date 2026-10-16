import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import {
  AdminRoleGuard,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  PermissionTierGuard,
  StudentScopeGuard,
} from './auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    JwtAuthGuard,
    PermissionTierGuard,
    StudentScopeGuard,
    AdminRoleGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [
    AuthService,
    JwtService,
    JwtAuthGuard,
    PermissionTierGuard,
    StudentScopeGuard,
    AdminRoleGuard,
    OptionalJwtAuthGuard,
  ],
})
export class AuthModule {}
