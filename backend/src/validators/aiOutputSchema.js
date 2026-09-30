import { z } from 'zod';

export const aiActionSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  text: z.string(),
  explanation: z.string().default(''),
  deadline: z.string().default(''),
  completed: z.boolean().default(false),
});

export const aiStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  description: z.string(),
  tip: z.string().default(''),
});

export const aiDeadlineSchema = z.object({
  date: z.string(),
  description: z.string(),
  urgency: z.enum(['high', 'medium', 'low', 'unknown']).default('medium'),
});

export const aiDocumentSchema = z.object({
  name: z.string(),
  purpose: z.string().default(''),
  isMandatory: z.boolean().default(true),
});

export const aiAnalysisOutputSchema = z.object({
  contentType: z.string().default('General Document'),
  title: z.string().default('Analyzed Document'),
  summary: z.string().default(''),
  simpleExplanation: z.string().default(''),
  keyPoints: z.array(z.string()).default([]),
  requiredActions: z.array(aiActionSchema).default([]),
  steps: z.array(aiStepSchema).default([]),
  deadlines: z.array(aiDeadlineSchema).default([]),
  requiredDocuments: z.array(aiDocumentSchema).default([]),
  importantWarnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  visualDescription: z.string().default(''),
  difficultyLevel: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  suggestedQuestions: z.array(z.string()).default([]),
});

export const aiQuestionAnswerSchema = z.object({
  answer: z.string(),
  sourceFound: z.boolean().default(true),
  relevantSection: z.string().optional(),
  suggestedFollowUp: z.array(z.string()).default([]),
});

export const aiTranslationOutputSchema = z.object({
  language: z.string(),
  simpleExplanation: z.string(),
  keyPoints: z.array(z.string()),
  requiredActions: z.array(aiActionSchema),
  steps: z.array(aiStepSchema).default([]),
});

export const aiSimplificationOutputSchema = z.object({
  evenSimplerExplanation: z.string(),
  analogyOrExample: z.string().default(''),
  bulletTakeaways: z.array(z.string()).default([]),
});
