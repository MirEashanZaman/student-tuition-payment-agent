import { AccountRecord } from '../../database.service';

export interface IAccountReader {
  findByStudentId(studentId: string): Promise<AccountRecord | null>;
  findById(id: string): Promise<AccountRecord | null>;
}

export interface IAccountWriter {
  updateBalance(id: string, newBalance: number, newDailySpent: number, newAnnualSpent?: number): Promise<AccountRecord>;
  updateDailyLimit(studentId: string, newLimit: number): Promise<AccountRecord>;
  depositFunds(studentId: string, amountBdt: number): Promise<AccountRecord>;
}

export interface IAccountRepository extends IAccountReader, IAccountWriter {}
