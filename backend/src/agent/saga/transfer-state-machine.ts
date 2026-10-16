import { Injectable, BadRequestException } from '@nestjs/common';

export type TransferState =
  | 'DRAFT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXECUTED'
  | 'SETTLED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED'
  | 'BLOCKED';

export interface SagaTransferRecord {
  id: string;
  student_id: string;
  source_amount_bdt: number;
  status: TransferState;
}

@Injectable()
export class TransferStateMachine {
  private readonly validTransitions: Record<TransferState, TransferState[]> = {
    DRAFT: ['PENDING_CONFIRMATION', 'CANCELLED', 'BLOCKED'],
    PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED', 'BLOCKED'],
    CONFIRMED: ['EXECUTED', 'SETTLED', 'FAILED', 'ROLLED_BACK'],
    EXECUTED: ['SETTLED', 'FAILED', 'ROLLED_BACK'],
    SETTLED: [],
    FAILED: ['ROLLED_BACK'],
    ROLLED_BACK: [],
    CANCELLED: [],
    BLOCKED: [],
  };

  canTransition(current: TransferState, next: TransferState): boolean {
    const allowed = this.validTransitions[current] || [];
    return allowed.includes(next);
  }

  assertTransition(current: TransferState, next: TransferState): void {
    if (!this.canTransition(current, next)) {
      throw new BadRequestException(
        `Invalid transfer state transition from ${current} to ${next}`,
      );
    }
  }

  createCompensatingTransaction(transfer: SagaTransferRecord, reason: string) {
    return {
      transferId: transfer.id,
      studentId: transfer.student_id,
      amountReleasedBdt: transfer.source_amount_bdt,
      targetState: 'ROLLED_BACK' as TransferState,
      compensationReason: reason,
      compensatedAt: new Date().toISOString(),
    };
  }
}
