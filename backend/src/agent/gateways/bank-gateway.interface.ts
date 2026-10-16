export interface BankAccountVerification {
  isValid: boolean;
  studentId: string;
  studentName: string;
  availableBalanceBdt: number;
}

export interface BankReservationResult {
  reservationId: string;
  success: boolean;
  amountReservedBdt: number;
}

export interface BankSettlementResult {
  settlementHash: string;
  settled: boolean;
  clearingNetwork: string;
  timestamp: string;
}

export interface IBankGateway {
  verifyAccount(studentId: string): Promise<BankAccountVerification>;
  reserveFunds(studentId: string, amountBdt: number): Promise<BankReservationResult>;
  releaseFunds(studentId: string, amountBdt: number): Promise<boolean>;
  settleTransfer(
    transferId: string,
    studentId: string,
    amountBdt: number,
    provider: string,
  ): Promise<BankSettlementResult>;
}

export const BANK_GATEWAY_TOKEN = Symbol('IBankGateway');
