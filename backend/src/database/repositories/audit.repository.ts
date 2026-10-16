import { Injectable } from '@nestjs/common';
import { DatabaseService, AuditRecord } from '../database.service';
import { IAuditRepository } from './interfaces/audit.interface';

@Injectable()
export class AuditRepository implements IAuditRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(entry: AuditRecord): Promise<AuditRecord> {
    return this.db.insertAuditLog(entry);
  }

  async findRecent(limit = 50, tier?: string, status?: string): Promise<AuditRecord[]> {
    return this.db.getAuditLogs(limit, tier, status);
  }

  async findById(id: string): Promise<AuditRecord | null> {
    return this.db.getAuditLogById(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteAuditLog(id);
  }
}
