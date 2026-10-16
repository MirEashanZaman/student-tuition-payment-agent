import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionTier } from '../agent/guardrails/permission-tier.guard';
import { JwtService } from './jwt.service';

export const REQUIRED_PERMISSION_TIER = 'requiredPermissionTier';

export const RequirePermissionTier = (tier: PermissionTier) =>
  SetMetadata(REQUIRED_PERMISSION_TIER, tier);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required.');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required in format "Bearer <token>".');
    }

    const payload = this.jwtService.verify(token);
    request.user = {
      ...payload,
      permissionTier: payload.permissionTier || PermissionTier.READ_ONLY,
    };
    return true;
  }
}

@Injectable()
export class PermissionTierGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<PermissionTier>(REQUIRED_PERMISSION_TIER, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentTier = request.user?.permissionTier || PermissionTier.READ_ONLY;
    const priority = {
      [PermissionTier.READ_ONLY]: 1,
      [PermissionTier.DRAFT]: 2,
      [PermissionTier.EXECUTE]: 3,
    };

    if ((priority[currentTier] ?? 0) < (priority[requiredTier] ?? 0)) {
      throw new ForbiddenException(`Permission denied. This action requires ${requiredTier}.`);
    }

    return true;
  }
}

@Injectable()
export class StudentScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.studentId) {
      throw new UnauthorizedException('Authenticated student session required.');
    }

    const candidateIds = [
      request.params?.id,
      request.params?.studentId,
      request.query?.studentId,
      request.body?.studentId,
    ];

    const targetStudentId = candidateIds.find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

    if (targetStudentId && targetStudentId !== user.studentId) {
      throw new ForbiddenException('Access denied: you can only access your own account and transfer records.');
    }

    return true;
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        try {
          const payload = this.jwtService.verify(token);
          request.user = {
            ...payload,
            permissionTier: payload.permissionTier || PermissionTier.READ_ONLY,
          };
        } catch {
        }
      }
    }

    return true;
  }
}
