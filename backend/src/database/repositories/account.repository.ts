import { Injectable } from '@nestjs/common';
import { DatabaseService, AccountRecord } from '../database.service';

@Injectable()
export class AccountRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByStudentId(studentId: string): Promise<AccountRecord | null> {
    return this.db.getAccountByStudentId(studentId);
  }

  async updateBalance(studentId: string, newBalance: number, newDailySpent: number): Promise<void> {
    await this.db.updateAccountBalance(studentId, newBalance, newDailySpent);
  }
}
