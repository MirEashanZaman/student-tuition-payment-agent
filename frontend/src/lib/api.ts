import {
  Account,
  RouteComparisonResult,
  TransferDraft,
  TransferRecord,
  AuditLog,
  AuthSession,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
let memoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fintech_access_token') || memoryToken;
      } catch {
        return memoryToken;
      }
    }
    return memoryToken;
  },
  setToken(token: string | null): void {
    memoryToken = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('fintech_access_token', token);
        } else {
          localStorage.removeItem('fintech_access_token');
        }
      } catch {
        return;
      }
    }
  },
  clearToken(): void {
    this.setToken(null);
  },
};

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async login(studentIdOrEmail: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIdOrEmail, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed: check your credentials.');
    }

    const session: AuthSession = await res.json();
    authStorage.setToken(session.accessToken);
    return session;
  },

  async getSession(): Promise<any> {
    const token = authStorage.getToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      authStorage.setToken(null);
      return null;
    }

    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      return;
    } finally {
      authStorage.setToken(null);
    }
  },

  async getDemoCredentials(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/demo-credentials`);
    if (!res.ok) return null;
    return res.json();
  },

  async getAccount(studentId = 'STU-2026-BDT01'): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts/${studentId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch account balance');
    return res.json();
  },

  async sendChatMessage(message: string, studentId = 'STU-2026-BDT01'): Promise<any> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, studentId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Chat request failed');
    }

    return res.json();
  },

  async compareRoutes(
    amountUsd: number,
    tuitionDeadline?: string,
    studentId = 'STU-2026-BDT01',
  ): Promise<RouteComparisonResult> {
    const res = await fetch(`${API_BASE}/routes/compare`, {
      method: 'POST',
      headers: getHeaders(),
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
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create transfer draft');
    }

    return res.json();
  },

  async confirmTransfer(
    transferId: string,
    confirmationToken: string,
    userConsent = true,
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/transfers/${transferId}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
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
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error('Failed to cancel draft');
    return res.json();
  },

  async getTransfers(studentId = 'STU-2026-BDT01'): Promise<TransferRecord[]> {
    const res = await fetch(`${API_BASE}/transfers?studentId=${studentId}`, {
      headers: getHeaders(),
    });

    if (!res.ok) return [];
    return res.json();
  },

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`, {
      headers: getHeaders(),
    });

    if (!res.ok) return [];
    return res.json();
  },

  async resetSandbox(): Promise<any> {
    const res = await fetch(`${API_BASE}/sandbox/reset`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error('Failed to reset sandbox');
    return res.json();
  },

  async exportLogs(): Promise<any> {
    const res = await fetch(`${API_BASE}/sandbox/export-logs`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error('Failed to export logs');
    return res.json();
  },
};
