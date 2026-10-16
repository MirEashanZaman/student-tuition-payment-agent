import { Account, RouteComparisonResult, TransferDraft, TransferRecord, AuditLog } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  async getAccount(studentId = 'STU-2026-BDT01'): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch account balance');
    return res.json();
  },

  async updateDailyLimit(studentId: string, dailyLimitBdt: number): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts/${studentId}/limits`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyLimitBdt }),
    });
    if (!res.ok) throw new Error('Failed to update daily limit');
    return res.json();
  },

  async depositFunds(studentId: string, amountBdt: number): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts/${studentId}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountBdt }),
    });
    if (!res.ok) throw new Error('Failed to deposit funds');
    return res.json();
  },

  async sendChatMessage(message: string, studentId = 'STU-2026-BDT01'): Promise<any> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, studentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Chat request failed');
    }
    return res.json();
  },

  async compareRoutes(amountUsd: number, tuitionDeadline?: string, studentId = 'STU-2026-BDT01'): Promise<RouteComparisonResult> {
    const res = await fetch(`${API_BASE}/routes/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, amountUsd, tuitionDeadline }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to compare routes');
    }
    return res.json();
  },

  async getRates(activeOnly = true, targetCurrency?: string): Promise<any[]> {
    const query = new URLSearchParams();
    if (activeOnly) query.append('activeOnly', 'true');
    if (targetCurrency) query.append('targetCurrency', targetCurrency);
    const res = await fetch(`${API_BASE}/rates?${query.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getRateById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/rates/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch rate ${id}`);
    return res.json();
  },

  async updateRate(id: string, updates: { exchangeRate?: number; isActive?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Failed to update rate ${id}`);
    return res.json();
  },

  async deleteRate(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/rates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete rate ${id}`);
    return res.json();
  },

  async createDraft(params: {
    studentId?: string;
    routeId: string;
    amountUsd: number;
    recipientUniversity: string;
    tuitionDeadline?: string;
  }): Promise<TransferDraft> {
    const res = await fetch(`${API_BASE}/transfers/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create transfer draft');
    }
    return res.json();
  },

  async updateDraft(
    transferId: string,
    updates: { recipientUniversity?: string; studentRegNumber?: string },
  ): Promise<TransferRecord> {
    const res = await fetch(`${API_BASE}/transfers/${transferId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update transfer draft');
    return res.json();
  },

  async deleteDraft(transferId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/transfers/${transferId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transfer draft');
    return res.json();
  },

  async confirmTransfer(transferId: string, confirmationToken: string, userConsent = true): Promise<any> {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationToken, userConsent }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to confirm transfer');
    }
    return res.json();
  },

  async cancelTransfer(transferId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to cancel draft');
    return res.json();
  },

  async getTransfers(studentId = 'STU-2026-BDT01', status?: string): Promise<TransferRecord[]> {
    const query = new URLSearchParams({ studentId });
    if (status) query.append('status', status);
    const res = await fetch(`${API_BASE}/transfers?${query.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getTransferById(id: string): Promise<TransferRecord> {
    const res = await fetch(`${API_BASE}/transfers/${id}`);
    if (!res.ok) throw new Error(`Transfer ${id} not found`);
    return res.json();
  },

  async getAuditLogs(limit = 50, tier?: string, status?: string): Promise<AuditLog[]> {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (tier) query.append('tier', tier);
    if (status) query.append('status', status);
    const res = await fetch(`${API_BASE}/audit?${query.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAuditLogById(id: string): Promise<AuditLog> {
    const res = await fetch(`${API_BASE}/audit/${id}`);
    if (!res.ok) throw new Error(`Audit log ${id} not found`);
    return res.json();
  },

  async deleteAuditLog(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/audit/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete audit log ${id}`);
    return res.json();
  },

  async resetSandbox(): Promise<any> {
    const res = await fetch(`${API_BASE}/sandbox/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset sandbox');
    return res.json();
  },

  async exportLogs(): Promise<any> {
    const res = await fetch(`${API_BASE}/sandbox/export-logs`);
    if (!res.ok) throw new Error('Failed to export logs');
    return res.json();
  },
};
