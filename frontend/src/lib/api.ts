import axios, { AxiosError } from 'axios';
import { Account, RouteComparisonResult, TransferDraft, TransferRecord, AuditLog } from '../types';
import {
  ChatMessageInputSchema,
  CompareRoutesInputSchema,
  DraftTransferInputSchema,
  ConfirmTransferInputSchema,
  UpdateDailyLimitInputSchema,
  DepositFundsInputSchema,
} from './schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4568/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      throw new Error(serverMessage);
    }
    if (Array.isArray(serverMessage) && serverMessage.length > 0) {
      throw new Error(serverMessage.join(', '));
    }
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(fallbackMessage);
}

export const api = {
  async getAccount(studentId = 'STU-2026-BDT01'): Promise<Account> {
    try {
      const response = await apiClient.get<Account>(`/accounts/${studentId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch account balance');
    }
  },

  async updateDailyLimit(studentId: string, dailyLimitBdt: number): Promise<Account> {
    try {
      const validated = UpdateDailyLimitInputSchema.parse({ studentId, dailyLimitBdt });
      const response = await apiClient.put<Account>(`/accounts/${validated.studentId}/limits`, {
        dailyLimitBdt: validated.dailyLimitBdt,
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update daily limit');
    }
  },

  async depositFunds(studentId: string, amountBdt: number): Promise<Account> {
    try {
      const validated = DepositFundsInputSchema.parse({ studentId, amountBdt });
      const response = await apiClient.post<Account>(`/accounts/${validated.studentId}/deposit`, {
        amountBdt: validated.amountBdt,
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to deposit funds');
    }
  },

  async sendChatMessage(message: string, studentId = 'STU-2026-BDT01'): Promise<any> {
    try {
      const validated = ChatMessageInputSchema.parse({ message, studentId });
      const response = await apiClient.post('/chat', validated);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Chat request failed');
    }
  },

  async compareRoutes(
    amountUsd: number,
    tuitionDeadline?: string,
    studentId = 'STU-2026-BDT01',
  ): Promise<RouteComparisonResult> {
    try {
      const validated = CompareRoutesInputSchema.parse({ amountUsd, tuitionDeadline, studentId });
      const response = await apiClient.post<RouteComparisonResult>('/routes/compare', validated);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to compare routes');
    }
  },

  async getRates(activeOnly = true, targetCurrency?: string): Promise<any[]> {
    try {
      const params: Record<string, string> = {};
      if (activeOnly) params.activeOnly = 'true';
      if (targetCurrency) params.targetCurrency = targetCurrency;
      const response = await apiClient.get<any[]>('/rates', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getRateById(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/rates/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to fetch rate ${id}`);
    }
  },

  async updateRate(id: string, updates: { exchangeRate?: number; isActive?: boolean }): Promise<any> {
    try {
      const response = await apiClient.put(`/rates/${id}`, updates);
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to update rate ${id}`);
    }
  },

  async deleteRate(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/rates/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to delete rate ${id}`);
    }
  },

  async createDraft(params: {
    studentId?: string;
    routeId: string;
    amountUsd: number;
    recipientUniversity: string;
    tuitionDeadline?: string;
  }): Promise<TransferDraft> {
    try {
      const validated = DraftTransferInputSchema.parse(params);
      const response = await apiClient.post<TransferDraft>('/transfers/draft', validated);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create transfer draft');
    }
  },

  async updateDraft(
    transferId: string,
    updates: { recipientUniversity?: string; studentRegNumber?: string },
  ): Promise<TransferRecord> {
    try {
      const response = await apiClient.put<TransferRecord>(`/transfers/${transferId}`, updates);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update transfer draft');
    }
  },

  async deleteDraft(transferId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/transfers/${transferId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete transfer draft');
    }
  },

  async confirmTransfer(transferId: string, confirmationToken: string, userConsent = true): Promise<any> {
    try {
      const validated = ConfirmTransferInputSchema.parse({ transferId, confirmationToken, userConsent });
      const response = await apiClient.post(`/transfers/${validated.transferId}/confirm`, {
        confirmationToken: validated.confirmationToken,
        userConsent: validated.userConsent,
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to confirm transfer');
    }
  },

  async cancelTransfer(transferId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/transfers/${transferId}/cancel`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to cancel draft');
    }
  },

  async getTransfers(studentId = 'STU-2026-BDT01', status?: string): Promise<TransferRecord[]> {
    try {
      const params: Record<string, string> = { studentId };
      if (status) params.status = status;
      const response = await apiClient.get<TransferRecord[]>('/transfers', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getTransferById(id: string): Promise<TransferRecord> {
    try {
      const response = await apiClient.get<TransferRecord>(`/transfers/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Transfer ${id} not found`);
    }
  },

  async getAuditLogs(limit = 50, tier?: string, status?: string): Promise<AuditLog[]> {
    try {
      const params: Record<string, string> = { limit: limit.toString() };
      if (tier) params.tier = tier;
      if (status) params.status = status;
      const response = await apiClient.get<AuditLog[]>('/audit', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getAuditLogById(id: string): Promise<AuditLog> {
    try {
      const response = await apiClient.get<AuditLog>(`/audit/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Audit log ${id} not found`);
    }
  },

  async deleteAuditLog(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/audit/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to delete audit log ${id}`);
    }
  },

  async resetSandbox(): Promise<any> {
    try {
      const response = await apiClient.post('/sandbox/reset');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to reset sandbox');
    }
  },

  async exportLogs(): Promise<any> {
    try {
      const response = await apiClient.get('/sandbox/export-logs');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to export logs');
    }
  },
};
