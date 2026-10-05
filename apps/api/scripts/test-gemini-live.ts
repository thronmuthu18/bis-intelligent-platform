import 'dotenv/config';
import { AssistantService, GroundedAnswerParams } from '../src/services/assistant.service.js';
import { GeminiTranslationProvider } from '../src/services/i18n/providers/gemini-translation.provider.js';

async function runGeminiTests() {
  console.log('================================================================');
  console.log('  GEMINI INTEGRATION & MULTILINGUAL VERIFICATION');
  console.log('================================================================');
  console.log(`AI_PROVIDER:           ${process.env.AI_PROVIDER}`);
  console.log(`AI_MODEL:              ${process.env.AI_MODEL}`);
  console.log(`TRANSLATION_PROVIDER:  ${process.env.TRANSLATION_PROVIDER}`);
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  console.log(`GEMINI_API_KEY present: ${Boolean(key && key.trim().length > 0)}`);
  if (key) {
    console.log(`Key preview:           ${key.slice(0, 6)}...${key.slice(-4)} (length: ${key.length})`);
  }
  console.log('----------------------------------------------------------------\n');

  if (!key) {
    console.error('❌ ERROR: Neither GEMINI_API_KEY nor AI_API_KEY is configured in apps/api/.env or environment.');
    console.error('Please configure your local secret in apps/api/.env:');
    console.error('  GEMINI_API_KEY=<your-gemini-api-key>\n');
    process.exit(1);
  }

  const sampleEvidence: GroundedAnswerParams['ragEvidence'] = [
    {
      isNumber: 'IS 10322 (Part 5/Sec 1) : 2012',
      title: 'Luminaires - Particular Requirements - Fixed General Purpose Luminaires',
      scope: 'Specifies safety requirements for fixed general purpose luminaires for use with tungsten filament, tubular fluorescent and other discharge lamps on supply voltages not exceeding 1 000 V.',
      status: 'MANDATORY_QCO',
      source: {
        title: 'Bureau of Indian Standards Official Portal',
        url: 'https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/10322',
        authorityLevel: 'AUTHORITATIVE',
      },
      citation: {
        citationIndex: 1,
        sourceTitle: 'Bureau of Indian Standards Official Portal',
        sourceUrl: 'https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/10322',
        authorityLevel: 'AUTHORITATIVE',
      },
    },
  ];

  const baseProductContext = {
    productName: 'EcoBright 50W Commercial LED Luminaire',
    productCategory: 'Electrical Lighting Fixtures',
    productSector: 'Electrotechnical',
    productDescription: 'Fixed general purpose ceiling mounted LED luminaire with isolated constant current driver.',
    intendedUse: 'Commercial office and industrial indoor illumination',
    targetMarket: 'Domestic Indian Market',
    manufacturerType: 'Domestic Manufacturer',
    technicalSpecifications: {
      voltage: '230V AC',
      frequency: '50Hz',
      wattage: '50W',
      ipRating: 'IP20',
      insulationClass: 'Class I',
    },
    ragEvidence: sampleEvidence,
    certificationContext: {
      schemeName: 'Scheme I (ISI Mark)',
      schemeCode: 'SCHEME-I',
      checklist: ['Factory Inspection', 'Routine Tests', 'Type Test Reports'],
    },
    testingContext: {
      tests: ['Insulation Resistance Test', 'Electric Strength (HV) Test', 'Thermal Endurance Test'],
    },
    complianceState: {
      stage: 'STANDARDS_IDENTIFIED',
      status: 'IN_PROGRESS',
    },
  };

  // 1. AI Assistant English
  console.log('----------------------------------------------------------------');
  console.log('TEST 1: AI Assistant English');
  console.log('----------------------------------------------------------------');
  try {
    const enQuery = 'What are the applicable BIS standards and required safety tests for this product?';
    console.log(`Query: "${enQuery}"`);
    const enResult = await AssistantService.generateGroundedAnswer({
      ...baseProductContext,
      query: enQuery,
    });
    console.log('✅ Response received from Gemini:');
    console.log(enResult.content.slice(0, 400) + '...\n');
    console.log(`Citations count: ${enResult.citations.length}`);
    console.log(`Grounded: ${enResult.grounded}`);
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // 2. AI Assistant Tamil
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 2: AI Assistant Tamil');
  console.log('----------------------------------------------------------------');
  try {
    const taQuery = 'இந்த தயாரிப்புக்கு பொருந்தும் BIS தரநிலைகள் மற்றும் தேவையான பாதுகாப்பு சோதனைகள் என்ன?';
    console.log(`Query: "${taQuery}"`);
    const taResult = await AssistantService.generateGroundedAnswer({
      ...baseProductContext,
      query: taQuery,
    });
    console.log('✅ Response received from Gemini (Tamil):');
    console.log(taResult.content.slice(0, 400) + '...\n');
    console.log(`Citations count: ${taResult.citations.length}`);
    console.log(`Grounded: ${taResult.grounded}`);
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // 3. AI Assistant Hindi
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 3: AI Assistant Hindi');
  console.log('----------------------------------------------------------------');
  try {
    const hiQuery = 'इस उत्पाद के लिए लागू बीआईएस मानक और आवश्यक सुरक्षा परीक्षण क्या हैं?';
    console.log(`Query: "${hiQuery}"`);
    const hiResult = await AssistantService.generateGroundedAnswer({
      ...baseProductContext,
      query: hiQuery,
    });
    console.log('✅ Response received from Gemini (Hindi):');
    console.log(hiResult.content.slice(0, 400) + '...\n');
    console.log(`Citations count: ${hiResult.citations.length}`);
    console.log(`Grounded: ${hiResult.grounded}`);
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Translation Provider Tests
  let translationProvider: GeminiTranslationProvider;
  try {
    translationProvider = new GeminiTranslationProvider();
  } catch (err: any) {
    console.error('❌ Failed to initialize GeminiTranslationProvider:', err.message);
    return;
  }

  // 4. English → Tamil Translation
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 4: English → Tamil translation');
  console.log('----------------------------------------------------------------');
  try {
    const enText = 'Bureau of Indian Standards requires mandatory certification under Scheme I for luminaires conforming to IS 10322 (Part 5/Sec 1) : 2012 operating at 230V AC.';
    console.log(`Input (EN): "${enText}"`);
    const taTranslation = await translationProvider.translate({
      text: enText,
      sourceLanguage: 'en',
      targetLanguage: 'ta',
      preservedTerms: ['Bureau of Indian Standards', 'Scheme I', 'IS 10322 (Part 5/Sec 1) : 2012', '230V AC'],
    });
    console.log(`Output (TA): "${taTranslation.translatedText}"`);
    console.log(`Preserved terms found:`, taTranslation.preservedTermsFound);
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  // 5. Tamil → English Translation
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 5: Tamil → English translation');
  console.log('----------------------------------------------------------------');
  try {
    const taText = 'அனைத்து உற்பத்தியாளர்களும் IS 10322 (Part 5/Sec 1) : 2012 தரநிலையின் கீழ் Scheme I உரிமத்தைப் பெறுவது கட்டாயமாகும்.';
    console.log(`Input (TA): "${taText}"`);
    const enTranslation = await translationProvider.translate({
      text: taText,
      sourceLanguage: 'ta',
      targetLanguage: 'en',
      preservedTerms: ['IS 10322 (Part 5/Sec 1) : 2012', 'Scheme I'],
    });
    console.log(`Output (EN): "${enTranslation.translatedText}"`);
    console.log(`Preserved terms found:`, enTranslation.preservedTermsFound);
  } catch (err: any) {
    console.error('❌ Test 5 Failed:', err.message);
  }

  // 6. Hindi Translation (English → Hindi)
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 6: Hindi translation (English → Hindi)');
  console.log('----------------------------------------------------------------');
  try {
    const enTextForHi = 'Bureau of Indian Standards enforces mandatory ISI Mark certification under Scheme I for all electrical equipment adhering to IS 10322.';
    console.log(`Input (EN): "${enTextForHi}"`);
    const hiTranslation = await translationProvider.translate({
      text: enTextForHi,
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      preservedTerms: ['Bureau of Indian Standards', 'ISI Mark', 'Scheme I', 'IS 10322'],
    });
    console.log(`Output (HI): "${hiTranslation.translatedText}"`);
    console.log(`Preserved terms found:`, hiTranslation.preservedTermsFound);
  } catch (err: any) {
    console.error('❌ Test 6 Failed:', err.message);
  }

  console.log('\n================================================================');
  console.log('  ALL 6 GEMINI INTEGRATION TESTS COMPLETED');
  console.log('================================================================');
}

runGeminiTests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
