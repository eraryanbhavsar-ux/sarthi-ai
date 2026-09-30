import { z } from 'zod';

export const analyzeTextSchema = z.object({
  text: z.string().min(5, 'Content must contain at least 5 characters').max(50000, 'Content exceeds 50,000 character limit'),
  title: z.string().optional(),
  language: z.string().optional().default('en'),
  guestId: z.string().optional(),
});

export const questionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  question: z.string().min(2, 'Question must be at least 2 characters').max(1000, 'Question too long'),
  language: z.string().optional().default('en'),
});

export const translateSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  targetLanguage: z.string().min(2, 'Target language is required (e.g., "hi", "mr", "en")'),
});

export const simplifySchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  level: z.enum(['simple', 'evenSimpler', 'childFriendly']).optional().default('evenSimpler'),
});

export const updateChecklistSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
  completed: z.boolean(),
});

export const voiceQuerySchema = z.object({
  transcript: z.string().min(1, 'Voice transcript is required'),
  sessionId: z.string().optional(),
  language: z.string().optional().default('en'),
});
