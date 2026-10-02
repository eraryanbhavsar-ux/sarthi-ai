import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { geminiService } from '../src/services/ai/geminiService.js';
import { visionAnalysisOutputSchema } from '../src/validators/aiOutputSchema.js';

describe('SARTHI Vision Pipeline & Services', () => {
  const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  test('visionAnalysisOutputSchema should validate concise vision schema with defaults', () => {
    const rawData = {
      description: 'I can see a clean office desk with a laptop and a water bottle.',
      objects: ['laptop', 'water bottle'],
      visibleText: ['Project Report 2026'],
      isDocument: false,
      documentHeading: '',
      confidence: 'high',
    };

    const parsed = visionAnalysisOutputSchema.safeParse(rawData);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.description, rawData.description);
    assert.deepEqual(parsed.data.objects, rawData.objects);
    assert.equal(parsed.data.isDocument, false);
    // Verified automatic defaults
    assert.deepEqual(parsed.data.importantInformation, []);
    assert.deepEqual(parsed.data.possibleActions, []);
    assert.deepEqual(parsed.data.warnings, []);
    assert.equal(parsed.data.spatialLayout, '');
    assert.deepEqual(parsed.data.detectedForm, { hasForm: false, fields: [] });
  });

  test('geminiService.analyzeVision should process raw base64 data and return valid structured analysis', async () => {
    if (!process.env.GEMINI_API_KEY) {
      await assert.rejects(
        async () => {
          await geminiService.analyzeVision({
            imageBase64Raw: rawBase64,
            imageMimeType: 'image/png',
          });
        },
        /SARTHI Vision requires GEMINI_API_KEY/
      );
    } else {
      const t0 = Date.now();
      const result = await geminiService.analyzeVision({
        imageBase64Raw: rawBase64,
        imageMimeType: 'image/png',
        userLanguage: 'en',
      });
      const elapsed = Date.now() - t0;

      assert.ok(result, 'Result should exist');
      assert.ok(typeof result.description === 'string' && result.description.length > 0, 'Description should be non-empty string');
      assert.ok(Array.isArray(result.objects), 'Objects should be an array');
      assert.ok(Array.isArray(result.visibleText), 'Visible text should be an array');
      assert.ok(typeof result.isDocument === 'boolean', 'isDocument should be boolean');
      assert.ok(typeof result.confidence === 'string', 'Confidence should be a string');
      console.log(`[Test Benchmark] analyzeVision completed in ${elapsed}ms: "${result.description}"`);
    }
  });

  test('geminiService.analyzeVision should enforce API key requirement if unconfigured', async () => {
    await assert.rejects(
      async () => {
        await geminiService.analyzeVision({
          imageBuffer: null,
          imageBase64Raw: null,
          imageMimeType: 'image/png',
        });
      },
      (err) => err.message.includes('SARTHI Vision requires GEMINI_API_KEY')
    );
  });
});
