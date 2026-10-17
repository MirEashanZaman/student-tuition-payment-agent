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

// Deterministic finite state machine orchestrating cross-border remittance Sagas.
// Terminal states (SETTLED, ROLLED_BACK, CANCELLED, BLOCKED) have empty transition sets
// to prevent illegal state cycles or balance double-deductions.
@Injectable()
export class TransferStateMachine {
  // Directed acyclic graph of permissible transfer state evolutions.
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

  // Pre-flight validation executed prior to committing financial mutations.
  // Throws BadRequestException to halt Saga execution if an invalid step is attempted.
  assertTransition(current: TransferState, next: TransferState): void {
    if (!this.canTransition(current, next)) {
      throw new BadRequestException(
        `Invalid transfer state transition from ${current} to ${next}`,
      );
    }
  }

  // Prepares the payload for Saga compensating events, restoring student balance and
  // unreserving corridor liquidity in bank partner gateways.
  // TODO: connect dead-letter queue (DLQ) if downstream clearing gateway fails to acknowledge rollback within SLA.
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
