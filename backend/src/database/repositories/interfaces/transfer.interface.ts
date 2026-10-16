import { TransferRecord } from '../../database.service';

export interface ITransferReader {
  findById(transferId: string): Promise<TransferRecord | null>;
  findByStudentId(studentId: string, status?: string): Promise<TransferRecord[]>;
}

export interface ITransferWriter {
  create(data: TransferRecord): Promise<TransferRecord>;
  updateStatus(
    transferId: string,
    status: TransferRecord['status'],
    confirmedAt?: Date,
  ): Promise<TransferRecord>;
  updateDraft(
    transferId: string,
    updates: { recipient_university?: string; student_reg_number?: string },
  ): Promise<TransferRecord>;
  delete(transferId: string): Promise<boolean>;
}

export interface ITransferRepository extends ITransferReader, ITransferWriter {}
