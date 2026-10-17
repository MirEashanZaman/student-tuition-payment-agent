import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PasswordHasher } from './password.util';
import { JwtService, JwtPayload } from './jwt.service';
import { PermissionTier } from '../agent/guardrails/permission-tier.guard';
import { v4 as uuidv4 } from 'uuid';

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    studentId: string;
    studentName: string;
    email: string;
    role: string;
    permissionTier: PermissionTier;
    balance: number;
    currency: string;
    dailyLimit: number;
    dailySpent: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    studentIdOrEmail: string,
    plainPassword: string,
    ipAddress = '127.0.0.1',
    requestedTier?: PermissionTier,
  ): Promise<AuthSessionResponse> {
    if (!studentIdOrEmail || !plainPassword) {
      throw new BadRequestException('Student ID / email and password are required.');
    }

    const account = await this.db.getAccountByStudentIdOrEmail(studentIdOrEmail);

    if (!account) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'AUTH_LOGIN_FAILED',
        permission_tier: 'READ_ONLY',
        action_summary: `Authentication failed: student ID/email "${studentIdOrEmail}" not found`,
        status: 'BLOCKED',
        ip_address: ipAddress,
        created_at: new Date(),
      });
      throw new UnauthorizedException('Invalid student ID/email or password.');
    }

    const isValidPassword = PasswordHasher.verifyPassword(
      plainPassword,
      account.password_hash,
    );

    if (!isValidPassword) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'AUTH_LOGIN_FAILED',
        permission_tier: 'READ_ONLY',
        account_id: account.id,
        action_summary: `Authentication failed: invalid password entered for ${account.student_id}`,
        status: 'BLOCKED',
        ip_address: ipAddress,
        created_at: new Date(),
      });
      throw new UnauthorizedException('Invalid student ID/email or password.');
    }

    const tier = requestedTier || PermissionTier.EXECUTE;
    const payload: JwtPayload = {
      sub: account.id,
      studentId: account.student_id,
      studentName: account.student_name,
      email: account.email,
      role: account.role || 'STUDENT',
      permissionTier: tier,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'AUTH_LOGIN_SUCCESS',
      permission_tier: 'READ_ONLY',
      account_id: account.id,
      action_summary: `Student ${account.student_id} logged in successfully via JWT session`,
      status: 'SUCCESS',
      ip_address: ipAddress,
      created_at: new Date(),
    });

    this.logger.log(`Student ${account.student_id} authenticated successfully.`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        studentId: account.student_id,
        studentName: account.student_name,
        email: account.email,
        role: account.role || 'STUDENT',
        permissionTier: tier,
        balance: account.balance,
        currency: account.currency,
        dailyLimit: account.daily_limit,
        dailySpent: account.daily_spent,
      },
    };
  }

  async validateSession(token: string) {
    const payload = this.jwtService.verify(token);
    const account = await this.db.getAccountByStudentId(payload.studentId);
    if (!account) {
      throw new UnauthorizedException('Student account associated with this session no longer exists.');
    }

    return {
      active: true,
      tokenPayload: payload,
      user: {
        studentId: account.student_id,
        studentName: account.student_name,
        email: account.email,
        role: account.role || 'STUDENT',
        permissionTier: payload.permissionTier || PermissionTier.EXECUTE,
        balance: account.balance,
        currency: account.currency,
        dailyLimit: account.daily_limit,
        dailySpent: account.daily_spent,
      },
    };
  }

  async logout(studentId?: string, ipAddress = '127.0.0.1') {
    if (studentId) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'AUTH_LOGOUT',
        permission_tier: 'READ_ONLY',
        action_summary: `Student ${studentId} logged out of sandbox session`,
        status: 'SUCCESS',
        ip_address: ipAddress,
        created_at: new Date(),
      });
    }

    return {
      success: true,
      message: 'Session terminated successfully.',
    };
  }

  async registerStudent(
    dto: {
      studentId: string;
      studentName: string;
      email: string;
      password: string;
    },
    ipAddress = '127.0.0.1',
    requestedTier?: PermissionTier,
  ): Promise<AuthSessionResponse> {
    if (!dto.studentId || !dto.studentName || !dto.email || !dto.password) {
      throw new BadRequestException('Student ID, student name, email, and password are required.');
    }

    const existingById = await this.db.getAccountByStudentId(dto.studentId.trim());
    if (existingById) {
      throw new BadRequestException(`An account with Student ID "${dto.studentId.trim()}" already exists.`);
    }

    const existingByEmail = await this.db.getAccountByStudentIdOrEmail(dto.email.trim());
    if (existingByEmail) {
      throw new BadRequestException(`An account with email "${dto.email.trim()}" already exists.`);
    }

    const hashedPassword = PasswordHasher.hashPassword(dto.password);
    const newAccount = await this.db.insertAccount({
      id: `acc-${dto.studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      student_id: dto.studentId.trim(),
      student_name: dto.studentName.trim(),
      email: dto.email.trim().toLowerCase(),
      currency: process.env.DEFAULT_SOURCE_CURRENCY || 'BDT',
      balance: parseFloat(process.env.INITIAL_STUDENT_BALANCE || '') || 850000.00,
      daily_limit: parseFloat(process.env.DAILY_TRANSFER_LIMIT_BDT || process.env.DAILY_TRANSFER_LIMIT || '') || 1000000.00,
      daily_spent: 0.00,
      password_hash: hashedPassword,
      role: 'STUDENT',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'AUTH_REGISTRATION_SUCCESS',
      permission_tier: 'READ_ONLY',
      account_id: newAccount.id,
      action_summary: `Student registration completed for ${newAccount.student_id} (${newAccount.student_name})`,
      status: 'SUCCESS',
      ip_address: ipAddress,
      created_at: new Date(),
    });

    const tier = requestedTier || PermissionTier.EXECUTE;
    const payload: JwtPayload = {
      sub: newAccount.id,
      studentId: newAccount.student_id,
      studentName: newAccount.student_name,
      email: newAccount.email,
      role: newAccount.role || 'STUDENT',
      permissionTier: tier,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Student ${newAccount.student_id} registered and authenticated successfully.`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        studentId: newAccount.student_id,
        studentName: newAccount.student_name,
        email: newAccount.email,
        role: newAccount.role || 'STUDENT',
        permissionTier: tier,
        balance: newAccount.balance,
        currency: newAccount.currency,
        dailyLimit: newAccount.daily_limit,
        dailySpent: newAccount.daily_spent,
      },
    };
  }

  getDemoCredentials() {
    return {
      studentId: 'STU-2026-BDT01',
      password: 'student123',
      studentName: 'Tanvir Ahmed',
      email: 'tanvir.student@fintechathon.org',
      role: 'STUDENT',
      permissionTier: PermissionTier.EXECUTE,
      note: 'Pre-seeded demo persona for FinTechathon 2026 sandbox testing.',
    };
  }
}
