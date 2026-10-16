import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILlmClient, LlmMessageResponse } from './llm-client.interface';
import { OfflineLlmClient } from './offline-llm.client';

@Injectable()
export class GeminiLlmClient implements ILlmClient {
  private readonly logger = new Logger(GeminiLlmClient.name);
  private genAI?: GoogleGenerativeAI;
  private readonly fallbackClient: OfflineLlmClient;

  constructor(private readonly config: ConfigService) {
    this.fallbackClient = new OfflineLlmClient();
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'mock_key_offline_agent' && apiKey.length > 10) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponse(userMessage: string, context?: any): Promise<LlmMessageResponse> {
    if (!this.genAI) {
      return this.fallbackClient.generateResponse(userMessage, context);
    }

    try {
      const modelName = this.config.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const prompt = `You are an AI cross-border tuition payment assistant for international students. User says: "${userMessage}". Student: ${context?.studentId || 'STU-2026-BDT01'}. Return a concise, helpful response.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { reply: text };
    } catch (err) {
      this.logger.warn(`Gemini API call failed, falling back to offline sandbox client: ${err.message}`);
      return this.fallbackClient.generateResponse(userMessage, context);
    }
  }
}
