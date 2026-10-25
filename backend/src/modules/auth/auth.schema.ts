import { z } from 'zod';

export const registerSchema = z.object({
  tenantName: z.string().min(2, 'Business workspace name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
