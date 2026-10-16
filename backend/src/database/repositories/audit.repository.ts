import { Injectable } from '@nestjs/common';
import { DatabaseService, AuditRecord } from '../database.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(entry: AuditRecord): Promise<AuditRecord> {
    return this.db.insertAuditLog(entry);
  }

  async findRecent(limit = 50): Promise<AuditRecord[]> {
    return this.db.getAuditLogs(limit);
  }
}
