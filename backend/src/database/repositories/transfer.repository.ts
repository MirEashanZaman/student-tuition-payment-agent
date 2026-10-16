import { Injectable } from '@nestjs/common';
import { DatabaseService, TransferRecord } from '../database.service';
import { ITransferRepository } from './interfaces/transfer.interface';

@Injectable()
export class TransferRepository implements ITransferRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: TransferRecord): Promise<TransferRecord> {
    return this.db.createTransfer(data);
  }

  async findById(transferId: string): Promise<TransferRecord | null> {
    return this.db.getTransferById(transferId);
  }

  async findByStudentId(studentId: string, status?: string): Promise<TransferRecord[]> {
    return this.db.getTransfersByStudentId(studentId, status);
  }

  async updateStatus(
    transferId: string,
    status: TransferRecord['status'],
    confirmedAt?: Date,
  ): Promise<TransferRecord> {
    return this.db.updateTransferStatus(transferId, status, confirmedAt);
  }

  async updateDraft(
    transferId: string,
    updates: { recipient_university?: string; student_reg_number?: string },
  ): Promise<TransferRecord> {
    return this.db.updateTransferDraft(transferId, updates);
  }

  async delete(transferId: string): Promise<boolean> {
    return this.db.deleteTransfer(transferId);
  }
}
