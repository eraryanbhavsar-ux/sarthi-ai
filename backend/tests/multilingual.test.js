import { test } from 'node:test';
import assert from 'node:assert';
import { aiTranslationOutputSchema } from '../src/validators/aiOutputSchema.js';
import { detectLanguageIntent } from '../src/services/ai/voiceCommandRouter.js';

test('aiTranslationOutputSchema should validate full structured translation', () => {
  const mockTranslation = {
    language: 'mr',
    title: 'राष्ट्रीय उच्च शिक्षण अनुदान सूचना २०२६',
    summary: 'विद्यार्थ्यांसाठी महत्त्वाची शिष्यवृत्ती सूचना.',
    simpleExplanation: 'तुम्हाला १५ ऑक्टोबर २०२६ पूर्वी तीन कागदपत्रे सादर करावी लागतील.',
    keyPoints: ['अंतिम मुदत १५ ऑक्टोबर २०२६ आहे'],
    requiredActions: [
      { id: 'act-1', text: 'उत्पन्न प्रमाणपत्र मिळवा', explanation: 'तहसीलदार प्रमाणपत्र', deadline: '१५ ऑक्टोबर २०२६', completed: false }
    ],
    steps: [
      { stepNumber: 1, title: 'कागदपत्रे स्कॅन करा', description: 'सर्व फाइल्स स्वच्छ स्कॅन करा', tip: '१०० KB ते ५०० KB दरम्यान ठेवा' }
    ],
    deadlines: [
      { date: '१५ ऑक्टोबर २०२६', description: 'ऑनलाइन पोर्टल अर्ज सादर करण्याची अंतिम मुदत', urgency: 'high' }
    ],
    requiredDocuments: [
      { name: 'आधार कार्ड', purpose: 'ओळख पडताळणी', isMandatory: true }
    ],
    importantWarnings: ['उशिरा आलेले अर्ज फेटाळले जातील'],
    missingInformation: ['हेल्पलाइन नंबर दिलेला नाही'],
    visualDescription: 'अधिकृत परिपत्रक'
  };

  const result = aiTranslationOutputSchema.safeParse(mockTranslation);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.deadlines.length, 1);
  assert.strictEqual(result.data.requiredDocuments.length, 1);
  assert.strictEqual(result.data.importantWarnings.length, 1);
});

test('detectLanguageIntent should identify Marathi commands in English and Devanagari', () => {
  const res1 = detectLanguageIntent('Hey Sarthi, explain this in Marathi.');
  assert.strictEqual(res1?.code, 'mr');

  const res2 = detectLanguageIntent('मराठीत हे समजावून सांग');
  assert.strictEqual(res2?.code, 'mr');

  const res3 = detectLanguageIntent('speak in marathi please');
  assert.strictEqual(res3?.code, 'mr');
});

test('detectLanguageIntent should identify Hindi commands in English and Devanagari', () => {
  const res1 = detectLanguageIntent('Hey Sarthi, switch to Hindi');
  assert.strictEqual(res1?.code, 'hi');

  const res2 = detectLanguageIntent('हिंदी में बताओ');
  assert.strictEqual(res2?.code, 'hi');
});

test('detectLanguageIntent should identify Gujarati, Tamil, Telugu, and Bengali', () => {
  assert.strictEqual(detectLanguageIntent('Tell me this in Gujarati')?.code, 'gu');
  assert.strictEqual(detectLanguageIntent('Read this in Tamil')?.code, 'ta');
  assert.strictEqual(detectLanguageIntent('Explain this in Telugu')?.code, 'te');
  assert.strictEqual(detectLanguageIntent('Translate this into Bengali')?.code, 'bn');
});

test('checkInstantCommand should route vision commands accurately', async () => {
  const { checkInstantCommand } = await import('../src/services/ai/voiceCommandRouter.js');

  const cmd1 = checkInstantCommand('what am I looking at');
  assert.strictEqual(cmd1?.intent, 'DESCRIBE_VISION');
  assert.strictEqual(cmd1?.action?.type, 'ANALYZE_CAMERA');

  const cmd2 = checkInstantCommand('what does this say');
  assert.strictEqual(cmd2?.intent, 'READ_TEXT');
  assert.strictEqual(cmd2?.action?.type, 'READ_VISIBLE_TEXT');

  const cmd3 = checkInstantCommand('read the document');
  assert.strictEqual(cmd3?.intent, 'READ_TEXT');
  assert.strictEqual(cmd3?.action?.type, 'READ_VISIBLE_TEXT');
});

