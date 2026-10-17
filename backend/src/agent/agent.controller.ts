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
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  IsDateString,
  IsIn,
} from 'class-validator';
import { AgentService } from './agent.service';
import { AgentToolsService } from './tools/agent-tools.service';
import { DatabaseService } from '../database/database.service';
import {
  JwtAuthGuard,
  PermissionTierGuard,
  RequirePermissionTier,
  StudentScopeGuard,
  AdminRoleGuard,
} from '../auth/auth.guard';
import { PermissionTier } from './guardrails/permission-tier.guard';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentId?: string;
}

export class CompareRoutesDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentId?: string;

  @IsNumber()
  @Min(50)
  amountUsd: number;

  @IsDateString()
  @IsOptional()
  tuitionDeadline?: string;

  @IsString()
  @IsOptional()
  @IsIn(['balanced', 'cheapest', 'fastest', 'reliable'])
  preference?: string;
}

export class CreateDraftDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  routeId: string;

  @IsNumber()
  @Min(50)
  amountUsd: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  recipientUniversity: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentRegNumber?: string;

  @IsDateString()
  @IsOptional()
  tuitionDeadline?: string;
}

export class UpdateDraftDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  recipientUniversity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentRegNumber?: string;
}

export class ConfirmTransferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  confirmationToken: string;

  @IsBoolean()
  userConsent: boolean;
}

export class CompensateTransferDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
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
  @Min(0)
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
  ) {}

  private async assertTransferOwner(transferId: string, studentId: string) {
    const transfer = await this.db.getTransferById(transferId);
    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }
    if (transfer.student_id !== studentId) {
      throw new ForbiddenException('You can only access your own transfer records.');
    }
    return transfer;
  }

  private parseAuditLimit(limit?: string): number {
    if (limit === undefined) {
      return 50;
    }
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('Audit limit must be an integer between 1 and 100.');
    }
    return parsed;
  }

  private assertSandboxEnvironment() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Sandbox administration is unavailable in production.');
    }
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Post('chat')
  async chat(
    @Body() body: ChatDto,
    @Req() request: { user: { studentId: string } },
  ) {
    if (!body || !body.message) {
      throw new BadRequestException('Message is required');
    }
    return await this.agentService.processChat(body.message, request.user.studentId);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('accounts/:id')
  async getAccount(
    @Param('id') id: string,
    @Req() request: { user: { studentId: string } },
  ) {
    const studentId = id === 'me' ? request.user.studentId : id;
    return await this.toolsService.getBalance(studentId, request.user.studentId);
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Put('accounts/:id/limits')
  async updateDailyLimit(@Param('id') id: string, @Body() dto: UpdateDailyLimitDto) {
    return await this.toolsService.updateDailyLimit(id, dto.dailyLimitBdt);
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
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

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Put('rates/:id')
  async updateRate(@Param('id') id: string, @Body() dto: UpdateRateDto) {
    return await this.toolsService.updateRate(id, {
      ...(dto.exchangeRate !== undefined ? { exchange_rate: dto.exchangeRate } : {}),
      ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
    });
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Delete('rates/:id')
  async deleteRate(@Param('id') id: string) {
    return await this.toolsService.deleteRate(id);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Post('routes/compare')
  async compareRoutes(
    @Body() body: CompareRoutesDto,
    @Req() request: { user: { studentId: string } },
  ) {
    return await this.toolsService.compareRoutes(
      request.user.studentId,
      body.amountUsd,
      body.tuitionDeadline,
      body.preference,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('transfers')
  async getTransfers(
    @Req() request: { user: { studentId: string } },
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return await this.db.getTransfersByStudentId(request.user.studentId, status);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('transfers/:id')
  async getTransferById(
    @Param('id') id: string,
    @Req() request: { user: { studentId: string } },
  ) {
    return await this.assertTransferOwner(id, request.user.studentId);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard, StudentScopeGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Post('transfers/draft')
  async createDraft(
    @Body() dto: CreateDraftDto,
    @Req() request: { user: { studentId: string } },
  ) {
    return await this.toolsService.createTransferDraft(
      request.user.studentId,
      dto.routeId,
      dto.amountUsd,
      dto.recipientUniversity,
      dto.studentRegNumber,
      dto.tuitionDeadline,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Put('transfers/:id')
  async updateDraftPut(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.assertTransferOwner(id, request.user.studentId);
    return await this.toolsService.updateTransferDraft(
      id,
      {
        recipient_university: dto.recipientUniversity,
        student_reg_number: dto.studentRegNumber,
      },
      request.user.studentId,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Patch('transfers/:id')
  async updateDraftPatch(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.assertTransferOwner(id, request.user.studentId);
    return await this.toolsService.updateTransferDraft(
      id,
      {
        recipient_university: dto.recipientUniversity,
        student_reg_number: dto.studentRegNumber,
      },
      request.user.studentId,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Delete('transfers/:id')
  async deleteTransferDraft(
    @Param('id') id: string,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.assertTransferOwner(id, request.user.studentId);
    return await this.toolsService.deleteTransferDraft(id, request.user.studentId);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.EXECUTE)
  @Post('transfers/:id/confirm')
  async confirmTransfer(
    @Param('id') id: string,
    @Body() dto: ConfirmTransferDto,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.assertTransferOwner(id, request.user.studentId);
    return await this.toolsService.confirmTransfer(
      id,
      dto.confirmationToken,
      dto.userConsent,
      true,
      request.user.studentId,
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
    await this.assertTransferOwner(id, request.user.studentId);
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

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.DRAFT)
  @Post('transfers/:id/cancel')
  async cancelTransfer(
    @Param('id') id: string,
    @Req() request: { user: { studentId: string } },
  ) {
    await this.assertTransferOwner(id, request.user.studentId);
    return await this.toolsService.cancelTransfer(id, request.user.studentId);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('audit')
  async getAudit(
    @Req() request: { user: { studentId: string } },
    @Query('limit') limit?: string,
    @Query('tier') tier?: string,
    @Query('status') status?: string,
  ) {
    const account = await this.db.getAccountByStudentId(request.user.studentId);
    if (!account) {
      throw new NotFoundException('Student account not found.');
    }
    const lim = this.parseAuditLimit(limit);
    return await this.db.getAuditLogsByAccountId(account.id, lim, tier, status);
  }

  @UseGuards(JwtAuthGuard, PermissionTierGuard)
  @RequirePermissionTier(PermissionTier.READ_ONLY)
  @Get('audit/:id')
  async getAuditLogById(
    @Param('id') id: string,
    @Req() request: { user: { studentId: string } },
  ) {
    const log = await this.toolsService.getAuditLogById(id);
    const account = await this.db.getAccountByStudentId(request.user.studentId);
    if (!account || log.account_id !== account.id) {
      throw new NotFoundException(`Audit record ${id} not found`);
    }
    return log;
  }

  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Delete('audit/:id')
  async deleteAuditLog(@Param('id') id: string) {
    return await this.toolsService.deleteAuditLog(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sandbox/reset')
  async resetSandbox() {
    this.assertSandboxEnvironment();
    await this.db.resetSandboxData();
    return {
      success: true,
      message: 'Sandbox state successfully reset to initial seed data.',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sandbox/export-logs')
  async exportLogs() {
    this.assertSandboxEnvironment();
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
