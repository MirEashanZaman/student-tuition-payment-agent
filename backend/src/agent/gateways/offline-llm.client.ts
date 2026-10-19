import { Injectable } from '@nestjs/common';
import { ILlmClient, LlmMessageResponse } from './llm-client.interface';

@Injectable()
export class OfflineLlmClient implements ILlmClient {
  async generateResponse(userMessage: string, context?: any): Promise<LlmMessageResponse> {
    const lower = userMessage.toLowerCase();

    if (lower.includes('balance') || lower.includes('how much') || lower.includes('account')) {
      return {
        reply: 'I checked your student financial account. Your current balance is 850,000.00 BDT (~$7,112.50 USD), with 1,000,000.00 BDT daily remittance quota available.',
        toolToExecute: 'getBalance',
        toolArgs: { studentId: context?.studentId || 'STU-2026-BDT01' },
      };
    }

    const amountMatch = lower.match(/\$?(\d+[\d,]*(\.\d+)?)\s*(usd|dollars|\$)?/i);
    let amountUsd = 3000;
    if (amountMatch) {
      const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (parsed > 0 && parsed <= 50000) {
        amountUsd = parsed;
      }
    }

    if (lower.includes('installment') || lower.includes('split') || lower.includes('milestone')) {
      const parts = lower.includes('3') ? 3 : 2;
      const partAmount = +(amountUsd / parts).toFixed(2);
      return {
        reply: `I have formulated a smart ${parts}-part installment payment plan for your $${amountUsd.toLocaleString()} USD tuition. Splitting into ${parts} installments of ~$${partAmount.toLocaleString()} USD keeps each settlement well within your 400,000 BDT per-transfer limit while meeting your university course registration deadlines.`,
      };
    }

    if (lower.includes('compare') || lower.includes('rate') || lower.includes('cheapest') || lower.includes('fastest') || lower.includes('route')) {
      return {
        reply: `I have analyzed and ranked the live tuition remittance corridors for $${amountUsd.toLocaleString()} USD from Bangladesh (BDT). EduPay Prime currently offers the optimal rate with Tier-1 direct university clearing.`,
        toolToExecute: 'compareRoutes',
        toolArgs: {
          studentId: context?.studentId || 'STU-2026-BDT01',
          amountUsd,
          tuitionDeadline: '2026-11-01',
        },
      };
    }

    if (lower.includes('pay') || lower.includes('send') || lower.includes('transfer') || lower.includes('tuition')) {
      return {
        reply: `I will prepare a tuition remittance draft for $${amountUsd.toLocaleString()} USD (~358,000 BDT) to Harvard University via EduPay Prime. In accordance with strict Permission Tiers, the autonomous agent cannot move funds unilaterally. Please review and provide explicit confirmation.`,
        toolToExecute: 'createTransferDraft',
        toolArgs: {
          studentId: context?.studentId || 'STU-2026-BDT01',
          amountUsd,
          recipientUniversity: 'Harvard University - Student Accounts',
          tuitionDeadline: '2026-11-01',
        },
      };
    }

    return {
      reply: 'I am your FinTechathon 2026 Student Tuition Payment Assistant. I can help you check your account balance, compare multi-objective cross-border corridors, and draft compliant university tuition payments from Bangladesh (BDT).',
    };
  }
}
