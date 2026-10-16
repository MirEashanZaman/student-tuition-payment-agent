import { Account, RouteComparisonResult, TransferDraft, TransferRecord, AuditLog } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  async getAccount(studentId = 'STU-2026-BDT01'): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch account balance');
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

  async getTransfers(studentId = 'STU-2026-BDT01'): Promise<TransferRecord[]> {
    const res = await fetch(`${API_BASE}/transfers?studentId=${studentId}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`);
    if (!res.ok) return [];
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
