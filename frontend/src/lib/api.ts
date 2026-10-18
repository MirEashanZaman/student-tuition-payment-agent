import axios, { AxiosError } from 'axios';
import {
  Account,
  RouteComparisonResult,
  TransferDraft,
  TransferRecord,
  AuditLog,
  AuthSession,
  LoginCredentials,
  RegistrationData,
  InstallmentPlan,
} from '../types';
import {
  ChatMessageInputSchema,
  CompareRoutesInputSchema,
  DraftTransferInputSchema,
  ConfirmTransferInputSchema,
  UpdateDailyLimitInputSchema,
  DepositFundsInputSchema,
  LoginInputSchema,
  RegistrationInputSchema,
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

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fintech_auth_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timed out. The server took too long to respond. Please try again.');
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error(`Unable to connect to the Tuition Payment server. Please verify the backend is online at ${API_BASE}.`);
    }
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      throw new Error(serverMessage);
    }
    if (Array.isArray(serverMessage) && serverMessage.length > 0) {
      throw new Error(serverMessage.join(', '));
    }
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Rate limit active, please wait a moment and try again.');
    }
    if (error.response?.status === 403) {
      throw new Error(error.response?.data?.message || 'Access Forbidden: Security policy blocked this request.');
    }
    if (error.response?.status === 404) {
      throw new Error('Requested resource not found.');
    }
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(fallbackMessage);
}

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fintech_auth_token');
  },
  getStudentId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fintech_auth_student_id');
  },
  setToken(token: string, studentId?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fintech_auth_token', token);
    if (studentId) {
      localStorage.setItem('fintech_auth_student_id', studentId);
    }
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('fintech_auth_token');
    localStorage.removeItem('fintech_auth_student_id');
    delete apiClient.defaults.headers.common['Authorization'];
  },
};

export const api = {
  getAuthToken(): string | null {
    return authStorage.getToken();
  },

  setAuthToken(token: string): void {
    authStorage.setToken(token);
  },

  clearAuthToken(): void {
    authStorage.clearToken();
  },

  async login(credentialsOrStudentId: LoginCredentials | string, maybePassword?: string): Promise<AuthSession> {
    try {
      const credentials = typeof credentialsOrStudentId === 'string'
        ? { studentIdOrEmail: credentialsOrStudentId, password: maybePassword || '' }
        : credentialsOrStudentId;
      const validated = LoginInputSchema.parse(credentials);
      const response = await apiClient.post<AuthSession>('/auth/login', validated);
      if (response.data?.accessToken) {
        authStorage.setToken(response.data.accessToken, response.data.user?.studentId);
      }
      return response.data;
    } catch (error) {
      handleApiError(error, 'Login failed');
    }
  },

  async registration(data: RegistrationData): Promise<AuthSession> {
    try {
      const validated = RegistrationInputSchema.parse(data);
      const response = await apiClient.post<AuthSession>('/auth/registration', validated);
      if (response.data?.accessToken) {
        authStorage.setToken(response.data.accessToken, response.data.user?.studentId);
      }
      return response.data;
    } catch (error) {
      handleApiError(error, 'Registration failed');
    }
  },
  async getAccount(studentId?: string): Promise<Account> {
    try {
      const targetId = studentId || authStorage.getStudentId() || 'me';
      const response = await apiClient.get<Account>(`/accounts/${targetId}`);
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

  async depositFunds(
    studentId: string,
    amountBdt: number,
    cardDetails?: {
      cardNumber?: string;
      cardHolder?: string;
      expiryDate?: string;
      cvv?: string;
    },
  ): Promise<Account> {
    try {
      const validated = DepositFundsInputSchema.parse({
        studentId,
        amountBdt,
        ...cardDetails,
      });
      const response = await apiClient.post<Account>(
        `/accounts/${validated.studentId}/card-deposit`,
        validated,
      );
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

  async planInstallments(
    totalAmountUsd: number,
    numInstallments = 2,
    tuitionDeadline?: string,
    routeId?: string,
  ): Promise<InstallmentPlan> {
    try {
      const response = await apiClient.post<InstallmentPlan>('/routes/installments', {
        totalAmountUsd,
        numInstallments,
        tuitionDeadline,
        routeId,
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to generate installment plan');
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

  async rollbackTransfer(transferId: string, reason = 'User requested transfer rollback'): Promise<any> {
    try {
      const response = await apiClient.post(`/transfers/${transferId}/rollback`, { reason });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to roll back transfer');
    }
  },

  async getTransfers(studentId?: string, status?: string): Promise<TransferRecord[]> {
    try {
      const params: Record<string, string> = {};
      if (studentId) params.studentId = studentId;
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

  async getTransferReceipt(transferId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/transfers/${transferId}/receipt`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch transfer receipt');
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



  async getSession(): Promise<any> {
    try {
      const token = this.getAuthToken();
      if (!token) return null;
      const response = await apiClient.get('/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      this.clearAuthToken();
      return null;
    }
  },

  async validateSession(): Promise<any> {
    return this.getSession();
  },

  async logout(studentId?: string): Promise<any> {
    try {
      const token = this.getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient.post('/auth/logout', { studentId }, { headers });
      this.clearAuthToken();
      return response.data;
    } catch (error) {
      this.clearAuthToken();
      return { success: true };
    }
  },

  async getDemoCredentials(): Promise<any> {
    try {
      const response = await apiClient.get('/auth/demo-credentials');
      return response.data;
    } catch (error) {
      return {
        studentId: 'STU-2026-BDT01',
        password: 'student123',
      };
    }
  },
};
