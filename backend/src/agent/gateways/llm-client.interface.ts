export interface LlmMessageResponse {
  reply: string;
  toolToExecute?: string;
  toolArgs?: Record<string, any>;
  suggestedActions?: Array<{
    label: string;
    actionType: 'CONFIRM_DRAFT' | 'SELECT_ROUTE' | 'CHECK_BALANCE';
    payload: any;
  }>;
}

export interface ILlmClient {
  generateResponse(userMessage: string, conversationContext?: any): Promise<LlmMessageResponse>;
}

export const LLM_CLIENT_TOKEN = Symbol('ILlmClient');
