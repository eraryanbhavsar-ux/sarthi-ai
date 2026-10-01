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
  title: z.string().optional(),
  summary: z.string().optional(),
  simpleExplanation: z.string(),
  keyPoints: z.array(z.string()).default([]),
  requiredActions: z.array(aiActionSchema).default([]),
  steps: z.array(aiStepSchema).default([]),
  deadlines: z.array(aiDeadlineSchema).default([]),
  requiredDocuments: z.array(aiDocumentSchema).default([]),
  importantWarnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  visualDescription: z.string().optional().default(''),
});

export const aiSimplificationOutputSchema = z.object({
  evenSimplerExplanation: z.string(),
  analogyOrExample: z.string().default(''),
  bulletTakeaways: z.array(z.string()).default([]),
});

export const formFieldOutputSchema = z.object({
  name: z.string().default('field'),
  label: z.string(),
  explanation: z.string(),
  isRequired: z.boolean().default(false),
  fieldIndex: z.number().default(0),
});

export const visionAnalysisOutputSchema = z.object({
  description: z.string(),
  visibleText: z.array(z.string()).default([]),
  importantInformation: z.array(z.string()).default([]),
  objects: z.array(z.string()).default([]),
  possibleActions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  isDocument: z.boolean().default(false),
  spatialLayout: z.string().default(''),
  detectedForm: z.object({
    hasForm: z.boolean().default(false),
    fields: z.array(formFieldOutputSchema).default([]),
  }).default({ hasForm: false, fields: [] }),
});

export const visionQuestionAnswerSchema = z.object({
  answer: z.string(),
  confident: z.boolean().default(true),
  suggestedFollowUp: z.array(z.string()).default([]),
});

export const formGuideOutputSchema = z.object({
  currentField: formFieldOutputSchema.optional(),
  totalFields: z.number().default(0),
  currentIndex: z.number().default(0),
  plainExplanation: z.string().default(''),
  validationTip: z.string().default(''),
  nextAction: z.string().default(''),
});
