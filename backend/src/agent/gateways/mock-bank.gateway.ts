import { Injectable } from '@nestjs/common';
import {
  IBankGateway,
  BankAccountVerification,
  BankReservationResult,
  BankSettlementResult,
} from './bank-gateway.interface';
import { DatabaseService } from '../../database/database.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MockBankGateway implements IBankGateway {
  constructor(private readonly db: DatabaseService) {}

  async verifyAccount(studentId: string): Promise<BankAccountVerification> {
    const account = await this.db.getAccountByStudentId(studentId);
    if (!account) {
      return {
        isValid: false,
        studentId,
        studentName: '',
        availableBalanceBdt: 0,
      };
    }
    return {
      isValid: true,
      studentId: account.student_id,
      studentName: account.student_name,
      availableBalanceBdt: Number(account.balance),
    };
  }

  async reserveFunds(studentId: string, amountBdt: number): Promise<BankReservationResult> {
    return {
      reservationId: `RES-${randomUUID().substring(0, 8).toUpperCase()}`,
      success: true,
      amountReservedBdt: amountBdt,
    };
  }

  async releaseFunds(studentId: string, amountBdt: number): Promise<boolean> {
    return true;
  }

  async settleTransfer(
    transferId: string,
    studentId: string,
    amountBdt: number,
    provider: string,
  ): Promise<BankSettlementResult> {
    return {
      settlementHash: `SETTLE-0x${randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase()}`,
      settled: true,
      clearingNetwork: provider,
      timestamp: new Date().toISOString(),
    };
  }
}
