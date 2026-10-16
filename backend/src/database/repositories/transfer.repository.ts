import { Injectable } from '@nestjs/common';
import { DatabaseService, TransferRecord } from '../database.service';

@Injectable()
export class TransferRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: TransferRecord): Promise<TransferRecord> {
    return this.db.createTransfer(data);
  }

  async findById(transferId: string): Promise<TransferRecord | null> {
    return this.db.getTransferById(transferId);
  }

  async findByStudentId(studentId: string): Promise<TransferRecord[]> {
    return this.db.getTransfersByStudentId(studentId);
  }

  async updateStatus(
    transferId: string,
    status: TransferRecord['status'],
    confirmedAt?: Date,
  ): Promise<TransferRecord> {
    return this.db.updateTransferStatus(transferId, status, confirmedAt);
  }
}
