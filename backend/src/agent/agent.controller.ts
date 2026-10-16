import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { AgentService } from './agent.service';
import { AgentToolsService } from './tools/agent-tools.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '../auth/jwt.service';

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
          // ignore invalid token for fallback
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
    @Headers('authorization') authHeader?: string,
  ) {
    const studentId = this.extractStudentId(authHeader, body.studentId);
    return await this.toolsService.compareRoutes(studentId, body.amountUsd, body.tuitionDeadline);
  }

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
  async getTransfers(
    @Query('studentId') studentId?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const id = this.extractStudentId(authHeader, studentId);
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
