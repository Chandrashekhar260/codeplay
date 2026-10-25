import { z } from 'zod';

export const dataElementInputSchema = z.object({
  piiCategory: z.string().min(1, 'PII Category is required'),
  dataSubjects: z.string().default('Customers / Patients'),
  volumeEstimate: z.string().optional(),
});

export const createActivitySchema = z.object({
  name: z.string().min(2, 'Activity name must be at least 2 characters'),
  businessFunction: z.string().min(2, 'Business function is required'), // e.g. "Diagnostics", "Billing", "Marketing"
  legalBasis: z.enum(['CONSENT', 'STATUTORY_OBLIGATION', 'LEGITIMATE_USE', 'CONTRACTUAL']),
  sourceId: z.string().uuid().optional(), // Link to an uploaded file source to auto-import its discovered PII!
  dataElements: z.array(dataElementInputSchema).optional(),
});

export const createDataFlowSchema = z.object({
  flowStage: z.enum(['COLLECTION', 'STORAGE', 'SHARING', 'DISPOSAL']),
  systemName: z.string().min(1, 'System name is required'), // "WhatsApp", "Local Excel", "Tally ERP"
  location: z.string().default('India'),
  safeguards: z.string().optional(),
});

export const createRecipientSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  recipientType: z.enum(['PROCESSOR', 'SUB_PROCESSOR', 'AUTHORITY', 'THIRD_PARTY']),
  country: z.string().default('India'),
});

export const createRetentionSchema = z.object({
  retentionPeriodMonths: z.number().int().positive('Retention period must be a positive number of months'),
  triggerEvent: z.string().default('CONSENT_WITHDRAWAL'),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateDataFlowInput = z.infer<typeof createDataFlowSchema>;
export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
export type CreateRetentionInput = z.infer<typeof createRetentionSchema>;
