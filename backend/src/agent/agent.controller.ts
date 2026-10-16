import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Optional,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { AgentService } from './agent.service';
import { AgentToolsService } from './tools/agent-tools.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '../auth/jwt.service';
import {
  JwtAuthGuard,
  PermissionTierGuard,
  RequirePermissionTier,
  StudentScopeGuard,
} from '../auth/auth.guard';
import { PermissionTier } from './guardrails/permission-tier.guard';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  studentId?: string;
}

export class CompareRoutesDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsNumber()
  amountUsd: number;

  @IsString()
  @IsOptional()
  tuitionDeadline?: string;

  @IsString()
  @IsOptional()
  preference?: string;
}

export class CreateDraftDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsNumber()
  amountUsd: number;

  @IsString()
  @IsNotEmpty()
  recipientUniversity: string;

  @IsString()
  @IsOptional()
  studentRegNumber?: string;

  @IsString()
  @IsOptional()
  tuitionDeadline?: string;
}

export class UpdateDraftDto {
  @IsString()
  @IsOptional()
  recipientUniversity?: string;

  @IsString()
  @IsOptional()
  studentRegNumber?: string;
}

export class ConfirmTransferDto {
  @IsString()
  @IsNotEmpty()
  confirmationToken: string;

  @IsBoolean()
  userConsent: boolean;
}

export class CompensateTransferDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class DepositDto {
  @IsNumber()
  @Min(1)
  amountBdt: number;
}

export class UpdateDailyLimitDto {
  @IsNumber()
  @Min(1)
  dailyLimitBdt: number;
}

export class UpdateRateDto {
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@Controller('api')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly toolsService: AgentToolsService,
    private readonly db: DatabaseService,
    @Optional() private readonly jwtService?: JwtService,
  ) {}

  private extractStudentId(authHeader?: string, explicitStudentId?: string): string {
    if (explicitStudentId) return explicitStudentId;
    if (authHeader && this.jwtService) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        try {
          const payload = this.jwtService.verify(token);
          if (payload?.studentId) return payload.studentId;
        } catch {
        }
      }
    }
    return 'STU-2026-BDT01';
  }

  @Post('chat')
  async chat(@Body() body: ChatDto, @Headers('authorization') authHeader?: string) {
    if (!body || !body.message) {
      throw new BadRequestException('Message is required');
    }
    const studentId = this.extractStudentId(authHeader, body.studentId);
    return await this.agentService.processChat(body.message, studentId);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return await this.toolsService.getBalance(id);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.EXECUTE)
  @Put('accounts/:id/limits')
  async updateDailyLimit(@Param('id') id: string, @Body() dto: UpdateDailyLimitDto) {
    return await this.toolsService.updateDailyLimit(id, dto.dailyLimitBdt);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.EXECUTE)
  @Post('accounts/:id/deposit')
  async depositFunds(@Param('id') id: string, @Body() dto: DepositDto) {
    return await this.toolsService.depositFunds(id, dto.amountBdt);
  }

  @Get('rates')
  async getRates(
    @Query('activeOnly') activeOnly?: string,
    @Query('targetCurrency') targetCurrency?: string,
  ) {
    let rates = await this.db.getAllRates();
    if (activeOnly === 'true') {
      rates = rates.filter((r) => r.is_active);
    }
    if (targetCurrency) {
      rates = rates.filter((r) => r.target_currency.toUpperCase() === targetCurrency.toUpperCase());
    }
    return rates;
  }

  @Get('rates/:id')
  async getRateById(@Param('id') id: string) {
    return await this.toolsService.getRateById(id);
  }

  @Put('rates/:id')
  async updateRate(@Param('id') id: string, @Body() dto: UpdateRateDto) {
    return await this.toolsService.updateRate(id, {
      ...(dto.exchangeRate !== undefined ? { exchange_rate: dto.exchangeRate } : {}),
      ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
    });
  }

  @Delete('rates/:id')
  async deleteRate(@Param('id') id: string) {
    return await this.toolsService.deleteRate(id);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Post('routes/compare')
  async compareRoutes(
    @Body() body: { studentId?: string; amountUsd: number; tuitionDeadline?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const studentId = this.extractStudentId(authHeader, body.studentId);
    return await this.toolsService.compareRoutes(studentId, body.amountUsd, body.tuitionDeadline);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Post('transfers/draft')
  async createDraft(
    @Body() dto: CreateDraftDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const studentId = this.extractStudentId(authHeader, dto.studentId);
    return await this.toolsService.createTransferDraft(
      studentId,
      dto.routeId,
      dto.amountUsd,
      dto.recipientUniversity,
      dto.studentRegNumber,
      dto.tuitionDeadline,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Put('transfers/:id')
  async updateDraftPut(@Param('id') id: string, @Body() dto: UpdateDraftDto) {
    return await this.toolsService.updateTransferDraft(id, {
      recipient_university: dto.recipientUniversity,
      student_reg_number: dto.studentRegNumber,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Patch('transfers/:id')
  async updateDraftPatch(@Param('id') id: string, @Body() dto: UpdateDraftDto) {
    return await this.toolsService.updateTransferDraft(id, {
      recipient_university: dto.recipientUniversity,
      student_reg_number: dto.studentRegNumber,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Delete('transfers/:id')
  async deleteTransferDraft(@Param('id') id: string) {
    return await this.toolsService.deleteTransferDraft(id);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.EXECUTE)
  @Post('transfers/:id/confirm')
  async confirmTransfer(@Param('id') id: string, @Body() dto: ConfirmTransferDto) {
    return await this.toolsService.confirmTransfer(
      id,
      dto.confirmationToken,
      dto.userConsent,
      true,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.EXECUTE)
  @Post('transfers/:id/compensate')
  async compensateTransfer(
    @Param('id') id: string,
    @Body() dto: CompensateTransferDto,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.toolsService.compensateTransfer(
      id,
      dto.reason || 'Simulated settlement failure rollback',
      request.user.studentId,
    );
    return {
      success: true,
      transferId: id,
      status: 'ROLLED_BACK',
      message: 'Compensating transaction executed. Reserved funds have been restored to student balance.',
    };
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Post('transfers/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return await this.db.updateTransferStatus(id, 'CANCELLED');
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('transfers')
  async getTransfers(
    @Query('studentId') studentId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const id = this.extractStudentId(authHeader, studentId);
    return await this.db.getTransfersByStudentId(id);
  }

  @Get('audit/:id')
  async getAuditLogById(@Param('id') id: string) {
    return await this.toolsService.getAuditLogById(id);
  }

  @Delete('audit/:id')
  async deleteAuditLog(@Param('id') id: string) {
    return await this.toolsService.deleteAuditLog(id);
  }

  @Post('sandbox/reset')
  async resetSandbox() {
    await this.db.resetSandboxData();
    return {
      success: true,
      message: 'Sandbox state successfully reset to initial seed data.',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sandbox/export-logs')
  async exportLogs() {
    const logs = await this.db.getAuditLogs(500);
    const transfers = await this.db.getTransfersByStudentId('STU-2026-BDT01');
    const account = await this.db.getAccountByStudentId('STU-2026-BDT01');

    return {
      exportedAt: new Date().toISOString(),
      accountSummary: account,
      transferCount: transfers.length,
      transfers,
      auditLogCount: logs.length,
      auditLogs: logs,
    };
  }
}
