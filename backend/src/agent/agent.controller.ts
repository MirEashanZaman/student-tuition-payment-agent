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
  BadRequestException,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { AgentService } from './agent.service';
import { AgentToolsService } from './tools/agent-tools.service';
import { DatabaseService } from '../database/database.service';

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
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    if (!body || !body.message) {
      throw new BadRequestException('Message is required');
    }
    return await this.agentService.processChat(body.message, body.studentId);
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return await this.toolsService.getBalance(id);
  }

  @Put('accounts/:id/limits')
  async updateDailyLimit(@Param('id') id: string, @Body() dto: UpdateDailyLimitDto) {
    return await this.toolsService.updateDailyLimit(id, dto.dailyLimitBdt);
  }

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

  @Post('routes/compare')
  async compareRoutes(@Body() body: CompareRoutesDto) {
    const studentId = body.studentId || 'STU-2026-BDT01';
    return await this.toolsService.compareRoutes(
      studentId,
      body.amountUsd,
      body.tuitionDeadline,
      body.preference,
    );
  }

  @Get('transfers')
  async getTransfers(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    const id = studentId || 'STU-2026-BDT01';
    return await this.db.getTransfersByStudentId(id, status);
  }

  @Get('transfers/:id')
  async getTransferById(@Param('id') id: string) {
    return await this.db.getTransferById(id);
  }

  @Post('transfers/draft')
  async createDraft(@Body() dto: CreateDraftDto) {
    return await this.toolsService.createTransferDraft(
      dto.studentId || 'STU-2026-BDT01',
      dto.routeId,
      dto.amountUsd,
      dto.recipientUniversity,
      dto.studentRegNumber,
      dto.tuitionDeadline,
    );
  }

  @Put('transfers/:id')
  async updateDraftPut(@Param('id') id: string, @Body() dto: UpdateDraftDto) {
    return await this.toolsService.updateTransferDraft(id, {
      recipient_university: dto.recipientUniversity,
      student_reg_number: dto.studentRegNumber,
    });
  }

  @Patch('transfers/:id')
  async updateDraftPatch(@Param('id') id: string, @Body() dto: UpdateDraftDto) {
    return await this.toolsService.updateTransferDraft(id, {
      recipient_university: dto.recipientUniversity,
      student_reg_number: dto.studentRegNumber,
    });
  }

  @Delete('transfers/:id')
  async deleteTransferDraft(@Param('id') id: string) {
    return await this.toolsService.deleteTransferDraft(id);
  }

  @Post('transfers/:id/confirm')
  async confirmTransfer(@Param('id') id: string, @Body() dto: ConfirmTransferDto) {
    return await this.toolsService.confirmTransfer(
      id,
      dto.confirmationToken,
      dto.userConsent,
      true,
    );
  }

  @Post('transfers/:id/compensate')
  async compensateTransfer(@Param('id') id: string, @Body() dto: CompensateTransferDto) {
    await this.toolsService.compensateTransfer(id, dto.reason || 'Simulated settlement failure rollback');
    return {
      success: true,
      transferId: id,
      status: 'ROLLED_BACK',
      message: 'Compensating transaction executed. Reserved funds have been restored to student balance.',
    };
  }

  @Post('transfers/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return await this.db.updateTransferStatus(id, 'CANCELLED');
  }

  @Get('audit')
  async getAudit(
    @Query('limit') limit?: string,
    @Query('tier') tier?: string,
    @Query('status') status?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 50;
    return await this.toolsService.getAuditLog(lim, tier, status);
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
