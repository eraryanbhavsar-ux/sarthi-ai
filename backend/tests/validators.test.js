import { test } from 'node:test';
import assert from 'node:assert';
import { registerSchema, loginSchema } from '../src/validators/authSchemas.js';
import { analyzeTextSchema, questionSchema } from '../src/validators/accessibilitySchemas.js';
import { aiAnalysisOutputSchema } from '../src/validators/aiOutputSchema.js';

test('registerSchema should validate correct registration input', () => {
  const result = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    password: 'password123',
    preferredLanguage: 'en',
  });
  assert.strictEqual(result.success, true);
});

test('registerSchema should reject invalid email', () => {
  const result = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'not-an-email',
    password: 'password123',
  });
  assert.strictEqual(result.success, false);
});

test('analyzeTextSchema should enforce min length', () => {
  const result = analyzeTextSchema.safeParse({
    text: 'abc',
  });
  assert.strictEqual(result.success, false);
});

test('questionSchema should require sessionId and question', () => {
  const result = questionSchema.safeParse({
    sessionId: 'session-123',
    question: 'What is the deadline?',
  });
  assert.strictEqual(result.success, true);
});

test('aiAnalysisOutputSchema should validate structured AI response', () => {
  const mockAI = {
    contentType: 'Government Circular',
    title: 'Scholarship Notice',
    summary: 'A notice for students.',
    simpleExplanation: 'You can apply for grant money.',
    keyPoints: ['Deadline is Oct 15'],
    requiredActions: [
      { id: '1', text: 'Upload ID', explanation: 'Aadhaar copy', deadline: 'Oct 15', completed: false }
    ],
    steps: [
      { stepNumber: 1, title: 'Gather ID', description: 'Find Aadhaar card', tip: 'Scan clearly' }
    ],
    deadlines: [
      { date: '15 Oct 2026', description: 'Application close', urgency: 'high' }
    ],
    requiredDocuments: [
      { name: 'Aadhaar', purpose: 'Identity', isMandatory: true }
    ],
    importantWarnings: ['Late forms rejected'],
    missingInformation: [],
    visualDescription: '',
    difficultyLevel: 'High',
    suggestedQuestions: ['What documents do I need?'],
  };

  const result = aiAnalysisOutputSchema.safeParse(mockAI);
  assert.strictEqual(result.success, true);
});
