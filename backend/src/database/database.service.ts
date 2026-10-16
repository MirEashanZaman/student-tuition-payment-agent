import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { PasswordHasher } from '../auth/password.util';

export interface AccountRecord {
  id: string;
  student_id: string;
  student_name: string;
  email: string;
  currency: string;
  balance: number;
  daily_limit: number;
  daily_spent: number;
  password_hash?: string;
  role?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RateRecord {
  id: string;
  provider_name: string;
  source_currency: string;
  target_currency: string;
  exchange_rate: number;
  inverse_rate: number;
  transfer_fee_flat_bdt: number;
  transfer_fee_percent: number;
  speed_hours: number;
  speed_description: string;
  reliability_score: number;
  compliance_rating: string;
  is_active: boolean;
  created_at: Date;
}

export interface TransferRecord {
  id: string;
  account_id: string;
  student_id: string;
  recipient_university: string;
  student_reg_number: string;
  source_currency: string;
  target_currency: string;
  target_amount_usd: number;
  source_amount_bdt: number;
  fee_total_bdt: number;
  fx_rate_applied: number;
  rate_id: string;
  provider_name: string;
  status:
    | 'DRAFT'
    | 'PENDING_CONFIRMATION'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'EXECUTED'
    | 'SETTLED'
    | 'FAILED'
    | 'ROLLED_BACK'
    | 'CANCELLED'
    | 'BLOCKED';
  tuition_deadline?: Date;
  estimated_delivery?: Date;
  deadline_warning: boolean;
  confirmation_token?: string;
  confirmed_at?: Date;
  why_recommended?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditRecord {
  id: string;
  event_type: string;
  permission_tier: 'READ_ONLY' | 'DRAFT' | 'EXECUTE';
  account_id?: string;
  transfer_id?: string;
  action_summary: string;
  details?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'FLAGGED' | 'WARNING';
  ip_address: string;
  created_at: Date;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private useMemoryStore = false;

  private memoryStore = {
    accounts: new Map<string, AccountRecord>(),
    rates: new Map<string, RateRecord>(),
    transfers: new Map<string, TransferRecord>(),
    audit_log: [] as AuditRecord[],
  };

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !process.env.FORCE_MEMORY_DB) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 3000,
        });
        const client = await this.pool.connect();
        client.release();
        this.logger.log('Connected to PostgreSQL successfully.');
        await this.runPostgresMigrations();
        await this.seedInitialData();
        return;
      } catch (err) {
        this.logger.warn(`PostgreSQL connection failed (${err.message}). Falling back to Sandbox In-Memory Store.`);
        this.useMemoryStore = true;
      }
    } else {
      this.logger.log('Using Sandbox In-Memory Store.');
      this.useMemoryStore = true;
    }

    await this.seedInitialData();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  isUsingMemoryStore(): boolean {
    return this.useMemoryStore;
  }

  private async runPostgresMigrations() {
    if (!this.pool) return;
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pool.query(sql);
        this.logger.log('PostgreSQL schema migrations executed.');
      }
    } catch (err) {
      this.logger.error(`Migration error: ${err.message}`);
    }
  }

  async seedInitialData() {
    const defaultAccount: AccountRecord = {
      id: 'acc-stu-2026-bdt',
      student_id: 'STU-2026-BDT01',
      student_name: 'Tanvir Ahmed',
      email: 'tanvir.student@fintechathon.org',
      currency: 'BDT',
      balance: 850000.00,
      daily_limit: 1000000.00,
      daily_spent: 0.00,
      password_hash: PasswordHasher.hashPassword('student123'),
      role: 'STUDENT',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const defaultRates: RateRecord[] = [
      {
        id: 'route-edupay-prime',
        provider_name: 'EduPay Prime (Campus Direct Clearing)',
        source_currency: 'BDT',
        target_currency: 'USD',
        exchange_rate: 0.008390,
        inverse_rate: 119.1895,
        transfer_fee_flat_bdt: 350.00,
        transfer_fee_percent: 0.0015,
        speed_hours: 24,
        speed_description: '24 Hours (Next-day settlement)',
        reliability_score: 0.99,
        compliance_rating: 'Tier-1 Education Network',
        is_active: true,
        created_at: new Date(),
      },
      {
        id: 'route-swiftwire-express',
        provider_name: 'SwiftWire Express (Priority Rail)',
        source_currency: 'BDT',
        target_currency: 'USD',
        exchange_rate: 0.008326,
        inverse_rate: 120.1056,
        transfer_fee_flat_bdt: 1200.00,
        transfer_fee_percent: 0.0035,
        speed_hours: 4,
        speed_description: '4 Hours (Urgent Same-Day Express)',
        reliability_score: 0.97,
        compliance_rating: 'SWIFT gpi Certified',
        is_active: true,
        created_at: new Date(),
      },
      {
        id: 'route-globalcampus-pay',
        provider_name: 'GlobalCampus Pay (Standard Remittance)',
        source_currency: 'BDT',
        target_currency: 'USD',
        exchange_rate: 0.008347,
        inverse_rate: 119.8035,
        transfer_fee_flat_bdt: 600.00,
        transfer_fee_percent: 0.0020,
        speed_hours: 48,
        speed_description: '48 Hours (2 Business Days)',
        reliability_score: 0.94,
        compliance_rating: 'Licensed MTO',
        is_active: true,
        created_at: new Date(),
      },
      {
        id: 'route-national-tt-wire',
        provider_name: 'National Bank Traditional Wire (SWIFT TT)',
        source_currency: 'BDT',
        target_currency: 'USD',
        exchange_rate: 0.008230,
        inverse_rate: 121.5066,
        transfer_fee_flat_bdt: 2500.00,
        transfer_fee_percent: 0.0050,
        speed_hours: 72,
        speed_description: '72 Hours (3-4 Business Days)',
        reliability_score: 0.89,
        compliance_rating: 'Legacy Commercial Bank',
        is_active: true,
        created_at: new Date(),
      },
    ];

    if (!this.useMemoryStore && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO accounts (id, student_id, student_name, email, currency, balance, daily_limit, daily_spent, password_hash, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (student_id) DO UPDATE SET balance = $6, daily_spent = $8, password_hash = $9, role = $10;`,
          [
            defaultAccount.id,
            defaultAccount.student_id,
            defaultAccount.student_name,
            defaultAccount.email,
            defaultAccount.currency,
            defaultAccount.balance,
            defaultAccount.daily_limit,
            defaultAccount.daily_spent,
            defaultAccount.password_hash,
            defaultAccount.role,
          ],
        );

        for (const r of defaultRates) {
          await this.pool.query(
            `INSERT INTO rates (id, provider_name, source_currency, target_currency, exchange_rate, inverse_rate, transfer_fee_flat_bdt, transfer_fee_percent, speed_hours, speed_description, reliability_score, compliance_rating, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET exchange_rate = $5, inverse_rate = $6, transfer_fee_flat_bdt = $7, transfer_fee_percent = $8;`,
            [
              r.id,
              r.provider_name,
              r.source_currency,
              r.target_currency,
              r.exchange_rate,
              r.inverse_rate,
              r.transfer_fee_flat_bdt,
              r.transfer_fee_percent,
              r.speed_hours,
              r.speed_description,
              r.reliability_score,
              r.compliance_rating,
              r.is_active,
            ],
          );
        }
        this.logger.log('PostgreSQL seed completed.');
        return;
      } catch (err) {
        this.logger.warn(`PostgreSQL seed error (${err.message}), falling back to memory store.`);
        this.useMemoryStore = true;
      }
    }

    this.memoryStore.accounts.set(defaultAccount.student_id, { ...defaultAccount });
    this.memoryStore.accounts.set(defaultAccount.id, { ...defaultAccount });
    defaultRates.forEach((r) => this.memoryStore.rates.set(r.id, { ...r }));
    this.logger.log(`In-memory database initialized with student ${defaultAccount.student_id} and ${defaultRates.length} remittance routes.`);
  }

  async getAccountByStudentId(studentId: string): Promise<AccountRecord | null> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM accounts WHERE student_id = $1 LIMIT 1', [studentId]);
      return res.rows[0] ? this.formatAccount(res.rows[0]) : null;
    }
    return this.memoryStore.accounts.get(studentId) || null;
  }

  async findByStudentId(studentId: string): Promise<AccountRecord | null> {
    return this.getAccountByStudentId(studentId);
  }

  async getAccountByStudentIdOrEmail(identifier: string): Promise<AccountRecord | null> {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'SELECT * FROM accounts WHERE LOWER(student_id) = $1 OR LOWER(email) = $1 LIMIT 1',
        [clean],
      );
      return res.rows[0] ? this.formatAccount(res.rows[0]) : null;
    }
    for (const acc of this.memoryStore.accounts.values()) {
      if (
        acc.student_id.toLowerCase() === clean ||
        acc.email.toLowerCase() === clean
      ) {
        return acc;
      }
    }
    return null;
  }

  async getAccountById(id: string): Promise<AccountRecord | null> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM accounts WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? this.formatAccount(res.rows[0]) : null;
    }
    return this.memoryStore.accounts.get(id) || null;
  }

  async updateAccountBalance(id: string, newBalance: number, newDailySpent: number): Promise<AccountRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'UPDATE accounts SET balance = $1, daily_spent = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [newBalance, newDailySpent, id],
      );
      return this.formatAccount(res.rows[0]);
    }
    const acc = this.memoryStore.accounts.get(id);
    if (!acc) throw new Error(`Account ${id} not found`);
    acc.balance = newBalance;
    acc.daily_spent = newDailySpent;
    acc.updated_at = new Date();
    this.memoryStore.accounts.set(id, acc);
    this.memoryStore.accounts.set(acc.student_id, acc);
    return acc;
  }

  async getAllRates(): Promise<RateRecord[]> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM rates WHERE is_active = TRUE ORDER BY exchange_rate DESC');
      return res.rows.map(this.formatRate);
    }
    return Array.from(this.memoryStore.rates.values()).filter((r) => r.is_active);
  }

  async findAllActive(): Promise<RateRecord[]> {
    return this.getAllRates();
  }

  async getRateById(id: string): Promise<RateRecord | null> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM rates WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? this.formatRate(res.rows[0]) : null;
    }
    return this.memoryStore.rates.get(id) || null;
  }

  async createTransfer(record: TransferRecord): Promise<TransferRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO transfers (id, account_id, student_id, recipient_university, student_reg_number, source_currency, target_currency, target_amount_usd, source_amount_bdt, fee_total_bdt, fx_rate_applied, rate_id, provider_name, status, tuition_deadline, estimated_delivery, deadline_warning, confirmation_token, why_recommended)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING *`,
        [
          record.id,
          record.account_id,
          record.student_id,
          record.recipient_university,
          record.student_reg_number,
          record.source_currency,
          record.target_currency,
          record.target_amount_usd,
          record.source_amount_bdt,
          record.fee_total_bdt,
          record.fx_rate_applied,
          record.rate_id,
          record.provider_name,
          record.status,
          record.tuition_deadline,
          record.estimated_delivery,
          record.deadline_warning,
          record.confirmation_token,
          record.why_recommended,
        ],
      );
      return this.formatTransfer(res.rows[0]);
    }
    this.memoryStore.transfers.set(record.id, { ...record });
    return record;
  }

  async getTransferById(id: string): Promise<TransferRecord | null> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM transfers WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? this.formatTransfer(res.rows[0]) : null;
    }
    return this.memoryStore.transfers.get(id) || null;
  }

  async updateTransferStatus(id: string, status: TransferRecord['status'], confirmedAt?: Date): Promise<TransferRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'UPDATE transfers SET status = $1, confirmed_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [status, confirmedAt || null, id],
      );
      return this.formatTransfer(res.rows[0]);
    }
    const t = this.memoryStore.transfers.get(id);
    if (!t) throw new Error(`Transfer ${id} not found`);
    t.status = status;
    if (confirmedAt) t.confirmed_at = confirmedAt;
    t.updated_at = new Date();
    this.memoryStore.transfers.set(id, t);
    return t;
  }

  async updateTransferDraft(
    id: string,
    updates: { recipient_university?: string; student_reg_number?: string },
  ): Promise<TransferRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'UPDATE transfers SET recipient_university = COALESCE($1, recipient_university), student_reg_number = COALESCE($2, student_reg_number), updated_at = NOW() WHERE id = $3 RETURNING *',
        [updates.recipient_university || null, updates.student_reg_number || null, id],
      );
      return this.formatTransfer(res.rows[0]);
    }
    const t = await this.getTransferById(id);
    if (!t) throw new Error(`Transfer ${id} not found`);
    if (updates.recipient_university) t.recipient_university = updates.recipient_university;
    if (updates.student_reg_number) t.student_reg_number = updates.student_reg_number;
    t.updated_at = new Date();
    this.memoryStore.transfers.set(id, t);
    return t;
  }

  async deleteTransfer(id: string): Promise<boolean> {
    if (!this.useMemoryStore && this.pool) {
      await this.pool.query('DELETE FROM transfers WHERE id = $1', [id]);
      return true;
    }
    return this.memoryStore.transfers.delete(id);
  }

  async depositFunds(studentId: string, amountBdt: number): Promise<AccountRecord> {
    const acc = await this.getAccountByStudentId(studentId);
    if (!acc) throw new Error(`Student ${studentId} not found`);
    const newBalance = +(acc.balance + amountBdt).toFixed(2);
    return this.updateAccountBalance(acc.id, newBalance, acc.daily_spent);
  }

  async updateDailyLimit(studentId: string, newDailyLimit: number): Promise<AccountRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'UPDATE accounts SET daily_limit = $1, updated_at = NOW() WHERE student_id = $2 RETURNING *',
        [newDailyLimit, studentId],
      );
      return this.formatAccount(res.rows[0]);
    }
    const acc = await this.getAccountByStudentId(studentId);
    if (!acc) throw new Error(`Student ${studentId} not found`);
    acc.daily_limit = newDailyLimit;
    acc.updated_at = new Date();
    this.memoryStore.accounts.set(acc.id, acc);
    this.memoryStore.accounts.set(acc.student_id, acc);
    return acc;
  }

  async updateRate(id: string, updates: Partial<RateRecord>): Promise<RateRecord> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query(
        'UPDATE rates SET exchange_rate = COALESCE($1, exchange_rate), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
        [updates.exchange_rate ?? null, updates.is_active ?? null, id],
      );
      return this.formatRate(res.rows[0]);
    }
    const r = await this.getRateById(id);
    if (!r) throw new Error(`Rate ${id} not found`);
    Object.assign(r, updates);
    this.memoryStore.rates.set(id, r);
    return r;
  }

  async deleteRate(id: string): Promise<boolean> {
    if (!this.useMemoryStore && this.pool) {
      await this.pool.query('UPDATE rates SET is_active = FALSE WHERE id = $1', [id]);
      return true;
    }
    const r = await this.getRateById(id);
    if (!r) return false;
    r.is_active = false;
    this.memoryStore.rates.set(id, r);
    return true;
  }

  async getAuditLogById(id: string): Promise<AuditRecord | null> {
    const logs = await this.getAuditLogs(500);
    return logs.find((l) => l.id === id) || null;
  }

  async deleteAuditLog(id: string): Promise<boolean> {
    const initialLen = this.memoryStore.audit_log.length;
    this.memoryStore.audit_log = this.memoryStore.audit_log.filter((l) => l.id !== id);
    return this.memoryStore.audit_log.length < initialLen;
  }

  async getTransfersByStudentId(studentId: string, status?: string): Promise<TransferRecord[]> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM transfers WHERE student_id = $1 ORDER BY created_at DESC', [studentId]);
      const list = res.rows.map(this.formatTransfer);
      return status ? list.filter((t) => t.status === status) : list;
    }
    let list = Array.from(this.memoryStore.transfers.values())
      .filter((t) => t.student_id === studentId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    if (status) {
      list = list.filter((t) => t.status === status);
    }
    return list;
  }

  async insertAuditLog(record: AuditRecord): Promise<AuditRecord> {
    if (!this.useMemoryStore && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO audit_log (id, event_type, permission_tier, account_id, transfer_id, action_summary, details, status, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            record.id,
            record.event_type,
            record.permission_tier,
            record.account_id,
            record.transfer_id,
            record.action_summary,
            record.details,
            record.status,
            record.ip_address,
          ],
        );
        return record;
      } catch (err) {
        this.logger.error(`Audit insert error: ${err.message}`);
      }
    }
    this.memoryStore.audit_log.unshift({ ...record });
    return record;
  }

  async writeAuditLog(entry: Partial<AuditRecord>): Promise<AuditRecord> {
    const fullRecord: AuditRecord = {
      id: entry.id || uuidv4(),
      event_type: entry.event_type || 'SYSTEM_EVENT',
      permission_tier: entry.permission_tier || 'READ_ONLY',
      account_id: entry.account_id,
      transfer_id: entry.transfer_id,
      action_summary: entry.action_summary || '',
      details: entry.details,
      status: entry.status || 'SUCCESS',
      ip_address: entry.ip_address || '127.0.0.1',
      created_at: entry.created_at || new Date(),
    };
    return this.insertAuditLog(fullRecord);
  }

  async getAuditLogs(limit = 100, tier?: string, status?: string): Promise<AuditRecord[]> {
    if (!this.useMemoryStore && this.pool) {
      const res = await this.pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1', [limit]);
      let list = res.rows.map(this.formatAudit);
      if (tier) list = list.filter((l) => l.permission_tier === tier);
      if (status) list = list.filter((l) => l.status === status);
      return list;
    }
    let list = this.memoryStore.audit_log;
    if (tier) list = list.filter((l) => l.permission_tier === tier);
    if (status) list = list.filter((l) => l.status === status);
    return list.slice(0, limit);
  }

  async resetSandboxData() {
    this.memoryStore.accounts.clear();
    this.memoryStore.rates.clear();
    this.memoryStore.transfers.clear();
    this.memoryStore.audit_log = [];

    if (!this.useMemoryStore && this.pool) {
      await this.pool.query('TRUNCATE TABLE transfers, audit_log CASCADE');
    }
    await this.seedInitialData();
  }

  private formatAccount(row: any): AccountRecord {
    return {
      ...row,
      balance: parseFloat(row.balance),
      daily_limit: parseFloat(row.daily_limit),
      daily_spent: parseFloat(row.daily_spent),
      password_hash: row.password_hash,
      role: row.role || 'STUDENT',
    };
  }

  private formatRate(row: any): RateRecord {
    return {
      ...row,
      exchange_rate: parseFloat(row.exchange_rate),
      inverse_rate: parseFloat(row.inverse_rate),
      transfer_fee_flat_bdt: parseFloat(row.transfer_fee_flat_bdt),
      transfer_fee_percent: parseFloat(row.transfer_fee_percent),
      speed_hours: parseInt(row.speed_hours, 10),
      reliability_score: parseFloat(row.reliability_score),
    };
  }

  private formatTransfer(row: any): TransferRecord {
    return {
      ...row,
      target_amount_usd: parseFloat(row.target_amount_usd),
      source_amount_bdt: parseFloat(row.source_amount_bdt),
      fee_total_bdt: parseFloat(row.fee_total_bdt),
      fx_rate_applied: parseFloat(row.fx_rate_applied),
    };
  }

  private formatAudit(row: any): AuditRecord {
    return {
      ...row,
    };
  }
}
