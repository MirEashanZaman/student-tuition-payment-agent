import { AuditRecord } from '../../database.service';

export interface IAuditReader {
  findRecent(limit?: number, tier?: string, status?: string): Promise<AuditRecord[]>;
  findById(id: string): Promise<AuditRecord | null>;
}

export interface IAuditWriter {
  create(entry: AuditRecord): Promise<AuditRecord>;
  delete(id: string): Promise<boolean>;
}

export interface IAuditRepository extends IAuditReader, IAuditWriter {}
