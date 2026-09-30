import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  preferredLanguage: z.string().optional().default('en'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updatePreferencesSchema = z.object({
  textSize: z.enum(['normal', 'large', 'xlarge']).optional(),
  highContrast: z.enum(['none', 'dark', 'light']).optional(),
  readingMode: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  simplifiedInterface: z.boolean().optional(),
  voiceMode: z.boolean().optional(),
  preferredLanguage: z.string().optional(),
});
