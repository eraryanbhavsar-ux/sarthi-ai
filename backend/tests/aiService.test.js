import { test } from 'node:test';
import assert from 'node:assert';
import { geminiService } from '../src/services/ai/geminiService.js';

test('geminiService.analyzeContent should return a structured result with required fields', async () => {
  const sample = `Notice of Fee Payment: All students must submit Rs 5000 before 20th November 2026. Required: Aadhaar card and Fee Receipt.`;
  const result = await geminiService.analyzeContent({
    text: sample,
    contentType: 'text',
    userLanguage: 'en',
  });

  assert.ok(result.title);
  assert.ok(result.summary);
  assert.ok(result.simpleExplanation);
  assert.ok(Array.isArray(result.keyPoints));
  assert.ok(Array.isArray(result.requiredActions));
  assert.ok(Array.isArray(result.steps));
  assert.ok(Array.isArray(result.deadlines));
  assert.ok(Array.isArray(result.requiredDocuments));
});

test('geminiService.answerQuestion should answer grounded questions', async () => {
  const doc = `Application deadline is strictly 15th October 2026. Documents required: Income Certificate and Aadhaar.`;
  const qna = await geminiService.answerQuestion({
    documentContent: doc,
    question: 'What is the deadline?',
    userLanguage: 'en',
  });

  assert.ok(qna.answer);
  assert.strictEqual(typeof qna.sourceFound, 'boolean');
});

test('geminiService.answerQuestion should handle missing information truthfully', async () => {
  const doc = `Application deadline is strictly 15th October 2026.`;
  const qna = await geminiService.answerQuestion({
    documentContent: doc,
    question: 'What is the flight ticket price to Tokyo?',
    userLanguage: 'en',
  });

  assert.strictEqual(qna.sourceFound, false);
  assert.ok(qna.answer.includes("couldn't find that information") || qna.answer.includes('verify'));
});

test('geminiService.makeEvenSimpler should return plain language takeaways', async () => {
  const explanation = 'Candidates must ensure strict adherence to documentary validation criteria.';
  const simplified = await geminiService.makeEvenSimpler({
    simpleExplanation: explanation,
    level: 'evenSimpler',
  });

  assert.ok(simplified.evenSimplerExplanation);
  assert.ok(Array.isArray(simplified.bulletTakeaways));
});
