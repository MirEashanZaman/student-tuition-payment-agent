import { Controller, Post, Get, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
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

export class ConfirmTransferDto {
  @IsString()
  @IsNotEmpty()
  confirmationToken: string;

  @IsBoolean()
  userConsent: boolean;
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

  @Get('rates')
  async getRates() {
    return await this.db.getAllRates();
  }

  @Post('routes/compare')
  async compareRoutes(
    @Body() body: { studentId?: string; amountUsd: number; tuitionDeadline?: string },
  ) {
    const studentId = body.studentId || 'STU-2026-BDT01';
    return await this.toolsService.compareRoutes(studentId, body.amountUsd, body.tuitionDeadline);
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

  @Post('transfers/:id/confirm')
  async confirmTransfer(@Param('id') id: string, @Body() dto: ConfirmTransferDto) {
    return await this.toolsService.confirmTransfer(
      id,
      dto.confirmationToken,
      dto.userConsent,
      true,
    );
  }

  @Post('transfers/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return await this.db.updateTransferStatus(id, 'CANCELLED');
  }

  @Get('transfers')
  async getTransfers(@Query('studentId') studentId?: string) {
    const id = studentId || 'STU-2026-BDT01';
    return await this.db.getTransfersByStudentId(id);
  }

  @Get('transfers/:id')
  async getTransferById(@Param('id') id: string) {
    return await this.db.getTransferById(id);
  }

  @Get('audit')
  async getAudit(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 50;
    return await this.toolsService.getAuditLog(lim);
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
