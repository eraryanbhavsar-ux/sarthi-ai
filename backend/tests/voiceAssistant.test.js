import { test } from 'node:test';
import assert from 'node:assert';
import {
  stripWakeWord,
  detectLanguageIntent,
  checkInstantCommand,
  routeVoiceCommand,
} from '../src/services/ai/voiceCommandRouter.js';

test('stripWakeWord should strip wake word variations cleanly', () => {
  assert.strictEqual(stripWakeWord('Hey Sarthi, what is the deadline?'), 'what is the deadline?');
  assert.strictEqual(stripWakeWord('hey sarthi explain this document'), 'explain this document');
  assert.strictEqual(stripWakeWord('he sarthi, what do you see?'), 'what do you see?');
  assert.strictEqual(stripWakeWord('hey sarathi read this'), 'read this');
  assert.strictEqual(stripWakeWord('हे सारथी अंतिम मुदत काय आहे?'), 'अंतिम मुदत काय आहे?');
  assert.strictEqual(stripWakeWord('Hey Sarthi'), '');
  assert.strictEqual(stripWakeWord('hey sarthi'), '');
});

test('routeVoiceCommand should return greeting when only wake word is spoken', async () => {
  const result = await routeVoiceCommand({
    transcript: 'Hey Sarthi',
    language: 'en',
  });

  assert.strictEqual(result.intent, 'GREETING');
  assert.ok(result.spokenResponse.includes("I'm listening") || result.spokenResponse.includes("listening"));
});

test('routeVoiceCommand should use active document context for deadline question', async () => {
  const mockSession = {
    title: 'Post Matric Scholarship',
    summary: 'Scholarship circular for engineering students.',
    simpleExplanation: 'Apply before October 15, 2026 to get the scholarship.',
    deadlines: [{ date: '15 October 2026', description: 'Application Portal Deadline' }],
    requiredDocuments: [{ name: 'Aadhaar Card' }, { name: 'Income Certificate' }],
    steps: [{ stepNumber: 1, title: 'Gather Documents', description: 'Get Aadhaar and income certificate.' }],
  };

  const result = await routeVoiceCommand({
    transcript: 'Hey Sarthi, what is the deadline?',
    session: mockSession,
    language: 'en',
  });

  assert.ok(result.spokenResponse.includes('15 October 2026') || result.spokenResponse.includes('October 15'));
});

test('routeVoiceCommand should use existing vision context when asking what do you see', async () => {
  const mockVisionSession = {
    description: 'A blue student identity card with the name Rahul Sharma and valid until 2027.',
    visibleText: 'Student ID: STU-99214 Rahul Sharma Valid: 2027',
    importantInformation: ['Valid student identification card'],
  };

  const result = await routeVoiceCommand({
    transcript: 'Hey Sarthi, what do you see?',
    visionSession: mockVisionSession,
    activePage: 'vision',
    language: 'en',
  });

  // Must describe vision content and NOT blindly trigger camera re-capture
  assert.ok(
    result.spokenResponse.toLowerCase().includes('identity card') ||
    result.spokenResponse.toLowerCase().includes('card') ||
    result.spokenResponse.toLowerCase().includes('rahul') ||
    result.spokenResponse.toLowerCase().includes('blue') ||
    result.spokenResponse.toLowerCase().includes('student')
  );
  assert.notStrictEqual(result.spokenResponse, 'Analyzing what is in front of the camera.');
});

test('routeVoiceCommand should answer general capability questions', async () => {
  const result = await routeVoiceCommand({
    transcript: 'Hey Sarthi, what can you do?',
    language: 'en',
  });

  assert.ok(result.spokenResponse.length > 10);
  assert.ok(
    result.spokenResponse.toLowerCase().includes('sarthi') ||
    result.spokenResponse.toLowerCase().includes('document') ||
    result.spokenResponse.toLowerCase().includes('help')
  );
});

test('checkInstantCommand should trigger camera capture only when no existing vision context', () => {
  // Without existing vision context: triggers camera capture
  const withoutContext = checkInstantCommand('what do you see', { hasExistingVisionContext: false });
  assert.strictEqual(withoutContext?.intent, 'DESCRIBE_VISION');
  assert.strictEqual(withoutContext?.action?.type, 'ANALYZE_CAMERA');

  // With existing vision context: leaves handling to contextual generator
  const withContext = checkInstantCommand('what do you see', { hasExistingVisionContext: true });
  assert.strictEqual(withContext, null);
});
