import { z } from 'zod';

export const RouteComparisonZodSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amountUsd: z.number().positive('Tuition amount must be greater than zero').max(50000, 'Exceeds maximum single tuition query ceiling of $50,000 USD'),
  tuitionDeadline: z.string().optional(),
  preference: z.enum(['balanced', 'cheapest', 'fastest', 'reliable']).optional(),
});

export type RouteComparisonInput = z.infer<typeof RouteComparisonZodSchema>;

export const TransferDraftZodSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  routeId: z.string().min(1, 'Route ID is required'),
  amountUsd: z.number().positive('Tuition amount must be greater than zero').max(50000, 'Exceeds maximum single tuition draft ceiling'),
  recipientUniversity: z.string().min(2, 'Recipient university name must be at least 2 characters').max(200),
  studentRegNumber: z.string().min(1).default('REG-FALL-2026'),
  tuitionDeadline: z.string().optional(),
});

export type TransferDraftInput = z.infer<typeof TransferDraftZodSchema>;

export const ConfirmTransferZodSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  confirmationToken: z.string().min(8, 'Valid confirmation token is required'),
  userConsent: z.boolean().refine((val) => val === true, {
    message: 'Explicit user consent must be granted to execute fund transfer',
  }),
});

export type ConfirmTransferInput = z.infer<typeof ConfirmTransferZodSchema>;

export const AccountDailyLimitZodSchema = z.object({
  dailyLimitBdt: z.number().positive('Daily limit must be a positive amount').max(5000000, 'Daily limit cannot exceed 5,000,000 BDT'),
});

export const AccountDepositZodSchema = z.object({
  amountBdt: z.number().positive('Deposit amount must be greater than zero').max(5000000, 'Single deposit cannot exceed 5,000,000 BDT'),
});

export const ChatMessageZodSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  studentId: z.string().min(1).default('STU-2026-BDT01'),
});
