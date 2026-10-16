import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '../../database/database.service';
import {
  TransferDraftedEvent,
  TransferConfirmedEvent,
  TransferExecutedEvent,
  TransferCompensatedEvent,
  SecurityCheckFailedEvent,
  RouteComparedEvent,
} from './domain.events';

@Injectable()
export class AuditLogListener {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly db: DatabaseService) {}

  @OnEvent('transfer.drafted', { async: true })
  async handleTransferDrafted(event: TransferDraftedEvent) {
    await this.db.writeAuditLog({
      event_type: 'TRANSFER_DRAFT_CREATED',
      permission_tier: 'DRAFT',
      account_id: event.studentId,
      transfer_id: event.transferId,
      action_summary: `Created draft transfer for $${event.targetAmountUsd} USD via ${event.providerName} (${event.sourceAmountBdt.toLocaleString()} BDT). Awaiting human confirmation.`,
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
    });
    this.logger.log(`Audit log written: transfer.drafted for ${event.transferId}`);
  }

  @OnEvent('transfer.confirmed', { async: true })
  async handleTransferConfirmed(event: TransferConfirmedEvent) {
    await this.db.writeAuditLog({
      event_type: 'TRANSFER_CONFIRMED',
      permission_tier: 'EXECUTE',
      account_id: event.studentId,
      transfer_id: event.transferId,
      action_summary: `User explicitly confirmed transfer of ${event.sourceAmountBdt.toLocaleString()} BDT to university via ${event.providerName}. Funds settled.`,
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
    });
    this.logger.log(`Audit log written: transfer.confirmed for ${event.transferId}`);
  }

  @OnEvent('transfer.executed', { async: true })
  async handleTransferExecuted(event: TransferExecutedEvent) {
    await this.db.writeAuditLog({
      event_type: 'TRANSFER_EXECUTED',
      permission_tier: 'EXECUTE',
      account_id: event.studentId,
      transfer_id: event.transferId,
      action_summary: `Direct bank clearing dispatch executed for ${event.sourceAmountBdt.toLocaleString()} BDT via ${event.providerName}.`,
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
    });
  }

  @OnEvent('transfer.compensated', { async: true })
  async handleTransferCompensated(event: TransferCompensatedEvent) {
    await this.db.writeAuditLog({
      event_type: 'TRANSFER_COMPENSATED',
      permission_tier: 'EXECUTE',
      account_id: event.studentId,
      transfer_id: event.transferId,
      action_summary: `Compensating transaction executed: ${event.amountReleasedBdt.toLocaleString()} BDT released back to student account. Reason: ${event.reason}`,
      status: 'WARNING',
      ip_address: '127.0.0.1',
    });
  }

  @OnEvent('security.threat_flagged', { async: true })
  async handleSecurityCheckFailed(event: SecurityCheckFailedEvent) {
    await this.db.writeAuditLog({
      event_type: event.eventType,
      permission_tier: event.permissionTier as any,
      account_id: event.studentId,
      action_summary: `Security check blocked action: ${event.reason}`,
      status: 'BLOCKED',
      ip_address: '127.0.0.1',
    });
    this.logger.warn(`Audit security event logged: ${event.eventType}`);
  }

  @OnEvent('route.compared', { async: true })
  async handleRouteCompared(event: RouteComparedEvent) {
    await this.db.writeAuditLog({
      event_type: 'ROUTE_COMPARISON_PERFORMED',
      permission_tier: 'READ_ONLY',
      account_id: event.studentId,
      action_summary: `Compared remittance corridors for $${event.amountUsd} USD using ${event.chosenStrategy} scoring strategy.`,
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
    });
  }
}
