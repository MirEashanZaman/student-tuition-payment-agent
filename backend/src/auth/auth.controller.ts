import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength, IsEmail, MinLength, Matches } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  studentIdOrEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class RegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]{2,64}$/, {
    message: 'Student ID may only contain letters, numbers, hyphens, and underscores',
  })
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^[^\u0000-\u001F<>]{2,128}$/, {
    message: 'Student name must not contain HTML or control characters',
  })
  studentName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async registration(@Body() body: RegistrationDto, @Req() req: any) {
    if (!body || !body.studentId || !body.studentName || !body.email || !body.password) {
      throw new BadRequestException('Student ID, student name, email, and password are required');
    }
    const sanitizedBody = {
      ...body,
      studentId: body.studentId.trim(),
      studentName: body.studentName.trim(),
      email: body.email.trim().toLowerCase(),
    };
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    return await this.authService.registerStudent(sanitizedBody, ip);
  }

  @Post('register')
  async registerAlias(@Body() body: RegistrationDto, @Req() req: any) {
    return this.registration(body, req);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: any) {
    if (!body || !body.studentIdOrEmail || !body.password) {
      throw new BadRequestException('Student ID or Email and Password are required');
    }
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    return await this.authService.login(body.studentIdOrEmail.trim(), body.password, ip);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    return this.getSession(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
    @Req() req?: { ip?: string; user: { studentId: string } },
  ) {
    const [type, token] = (authHeader || '').split(' ');
    if (type !== 'Bearer' || !token || !req?.user?.studentId) {
      throw new UnauthorizedException('Authenticated student session required.');
    }
    const ip = req?.ip || '127.0.0.1';
    return await this.authService.logout(req.user.studentId, ip);
  }

  @Get('demo-credentials')
  getDemoCredentials() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.authService.getDemoCredentials();
  }
}
