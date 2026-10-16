import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  studentIdOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: any) {
    if (!body || !body.studentIdOrEmail || !body.password) {
      throw new BadRequestException('Student ID or Email and Password are required');
    }
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    return await this.authService.login(body.studentIdOrEmail, body.password, ip);
  }

  @Get('session')
  async getSession(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required.');
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token must be provided.');
    }
    return await this.authService.validateSession(token);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    return this.getSession(authHeader);
  }

  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
    @Body() body?: { studentId?: string },
    @Req() req?: any,
  ) {
    let studentId = body?.studentId;
    if (!studentId && authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        try {
          const session = await this.authService.validateSession(token);
          studentId = session.user.studentId;
        } catch {
          // ignore error on logout
        }
      }
    }
    const ip = req?.ip || '127.0.0.1';
    return await this.authService.logout(studentId, ip);
  }

  @Get('demo-credentials')
  getDemoCredentials() {
    return this.authService.getDemoCredentials();
  }
}
