import { z } from 'zod';

export const ChatMessageInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters')
    .transform((val) => val.normalize('NFKC')),
  studentId: z.string().min(1).default('STU-2026-BDT01'),
});

export const CompareRoutesInputSchema = z.object({
  amountUsd: z.number().positive('Tuition amount must be greater than zero'),
  tuitionDeadline: z.string().optional(),
  studentId: z.string().min(1).default('STU-2026-BDT01'),
});

export const DraftTransferInputSchema = z.object({
  studentId: z.string().min(1).default('STU-2026-BDT01'),
  routeId: z.string().min(1, 'Route identifier is required'),
  amountUsd: z.number().positive('Amount must be greater than zero'),
  recipientUniversity: z.string().min(2, 'University name must be at least 2 characters'),
  tuitionDeadline: z.string().optional(),
});

export const ConfirmTransferInputSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  confirmationToken: z.string().min(8, 'Confirmation token is required'),
  userConsent: z.boolean().default(true),
});

export const UpdateDailyLimitInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  dailyLimitBdt: z.number().positive('Daily limit must be greater than zero'),
});

export const DepositFundsInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amountBdt: z.number().positive('Deposit amount must be greater than zero').max(10000000, 'Deposit exceeds safety threshold'),
  cardNumber: z.string().max(24).regex(/^[\d\s-]*$/, 'Card number may only contain digits and separators').optional(),
  cardHolder: z.string().max(100).optional(),
  expiryDate: z.string().max(10).optional(),
  cvv: z.string().max(4).regex(/^\d*$/, 'CVV must be numeric').optional(),
});

export const LoginInputSchema = z.object({
  studentIdOrEmail: z.string().trim().min(1, 'Student ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
  permissionTier: z.enum(['READ_ONLY', 'DRAFT', 'EXECUTE']).optional(),
});

export const RegistrationInputSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(2, 'Student ID must be at least 2 characters')
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, 'Student ID may only contain letters, numbers, hyphens, and underscores'),
  studentName: z
    .string()
    .trim()
    .min(2, 'Student name must be at least 2 characters')
    .max(128)
    .regex(/^[^\u0000-\u001F<>]+$/, 'Student name must not contain HTML or control characters'),
  email: z.string().trim().email('Valid email address is required').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  permissionTier: z.enum(['READ_ONLY', 'DRAFT', 'EXECUTE']).optional(),
});
