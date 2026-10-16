import { Injectable } from '@nestjs/common';
import { DatabaseService, AccountRecord } from '../database.service';
import { IAccountRepository } from './interfaces/account.interface';

@Injectable()
export class AccountRepository implements IAccountRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByStudentId(studentId: string): Promise<AccountRecord | null> {
    return this.db.getAccountByStudentId(studentId);
  }

  async findById(id: string): Promise<AccountRecord | null> {
    return this.db.getAccountById(id);
  }

  async updateBalance(id: string, newBalance: number, newDailySpent: number): Promise<AccountRecord> {
    return this.db.updateAccountBalance(id, newBalance, newDailySpent);
  }

  async updateDailyLimit(studentId: string, newLimit: number): Promise<AccountRecord> {
    return this.db.updateDailyLimit(studentId, newLimit);
  }

  async depositFunds(studentId: string, amountBdt: number): Promise<AccountRecord> {
    return this.db.depositFunds(studentId, amountBdt);
  }
}
