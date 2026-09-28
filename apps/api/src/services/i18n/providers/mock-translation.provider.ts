// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Mock Translation Provider (Deterministic Test & Demo Provider)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ITranslationProvider,
  ProviderTranslateParams,
  ProviderTranslateResult,
} from './translation-provider.interface.js';

export class MockTranslationProvider implements ITranslationProvider {
  // Deterministic translation dictionary for standard phrases & mock sentences
  private static readonly TAMIL_DICTIONARY: Record<string, string> = {
    'What this standard means': 'இந்த தரநிலையின் விளக்கம்',
    'Why it matters to you': 'இது உங்களுக்கு ஏன் முக்கியமானது',
    'What you can check before buying': 'வாங்குவதற்கு முன் நீங்கள் சரிபார்க்க வேண்டியவை',
    'Official Source': 'அதிகாரப்பூர்வ மூல ஆதாரம்',
    'Next Step': 'அடுத்த கட்ட நடவடிக்கை',
    'Look for authentic ISI mark with valid CM/L licence number stamped on the item packaging':
      'தயாரிப்பு பேக்கேஜிங்கில் செல்லுபடியாகும் CM/L உரிம எண்ணுடன் கூடிய அசல் ISI முத்திரையைச் சரிபார்க்கவும்',
    'Safety requirements for luminaires and general lighting equipment':
      'விளக்குகள் மற்றும் பொது வெளிச்ச உபகரணங்களுக்கான பாதுகாப்புத் தேவைகள்',
    'Mandatory under QCO': 'QCO உத்தரவின் கீழ் கட்டாயமானது',
    'Specification for Gold and Gold Alloys, Jewellery/Artefacts':
      'தங்கம் மற்றும் தங்கக் கலவைகள், நகைகள் மற்றும் கைவினைப் பொருட்களுக்கான விவரக்குறிப்பு',
    'Specification for Silver and Silver Alloys, Jewellery/Artefacts':
      'வெள்ளி மற்றும் வெள்ளிக் கலவைகள், நகைகள் மற்றும் கைவினைப் பொருட்களுக்கான விவரக்குறிப்பு',
  };

  private static readonly HINDI_DICTIONARY: Record<string, string> = {
    'What this standard means': 'इस मानक का अर्थ',
    'Why it matters to you': 'यह आपके लिए क्यों महत्वपूर्ण है',
    'What you can check before buying': 'खरीदने से पहले आप क्या जांच सकते हैं',
    'Official Source': 'आधिकारिक स्रोत',
    'Next Step': 'अगला कदम',
    'Look for authentic ISI mark with valid CM/L licence number stamped on the item packaging':
      'उत्पाद पैकेजिंग पर वैध CM/L लाइसेंस संख्या के साथ प्रामाणिक ISI मार्क की जांच करें',
    'Safety requirements for luminaires and general lighting equipment':
      'प्रकाश जुड़नार और सामान्य प्रकाश उपकरणों के लिए सुरक्षा आवश्यकताएं',
    'Mandatory under QCO': 'QCO के तहत अनिवार्य',
    'Specification for Gold and Gold Alloys, Jewellery/Artefacts':
      'सोना और सोने के मिश्र धातु, आभूषण/कलाकृतियों के लिए विनिर्देश',
    'Specification for Silver and Silver Alloys, Jewellery/Artefacts':
      'चांदी और चांदी के मिश्र धातु, आभूषण/कलाकृतियों के लिए विनिर्देश',
  };

  public async translate(params: ProviderTranslateParams): Promise<ProviderTranslateResult> {
    const { text, sourceLanguage, targetLanguage, preservedTerms } = params;

    // If source and target are identical, return text as is
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        preservedTermsFound: preservedTerms.filter((term) => text.includes(term)),
      };
    }

    let translated = text;

    if (targetLanguage === 'ta') {
      // Check exact dictionary match first
      if (MockTranslationProvider.TAMIL_DICTIONARY[text]) {
        translated = MockTranslationProvider.TAMIL_DICTIONARY[text];
      } else {
        // Sentence-level word mapping fallback with prefix
        let working = text;
        for (const [enPhrase, taPhrase] of Object.entries(MockTranslationProvider.TAMIL_DICTIONARY)) {
          working = working.replace(new RegExp(enPhrase, 'gi'), taPhrase);
        }
        if (working !== text) {
          translated = working;
        } else {
          translated = `[தமிழ் விளக்கம்] ${text}`;
        }
      }
    } else if (targetLanguage === 'hi') {
      if (MockTranslationProvider.HINDI_DICTIONARY[text]) {
        translated = MockTranslationProvider.HINDI_DICTIONARY[text];
      } else {
        let working = text;
        for (const [enPhrase, hiPhrase] of Object.entries(MockTranslationProvider.HINDI_DICTIONARY)) {
          working = working.replace(new RegExp(enPhrase, 'gi'), hiPhrase);
        }
        if (working !== text) {
          translated = working;
        } else {
          translated = `[हिन्दी अनुवाद] ${text}`;
        }
      }
    } else {
      translated = text;
    }

    // Ensure preserved technical identifiers (e.g. IS 10322, CM/L-1234567, HUID) remain intact
    const foundPreserved: string[] = [];
    for (const term of preservedTerms) {
      if (text.includes(term)) {
        foundPreserved.push(term);
        // If the translation somehow removed or altered the term, ensure it is re-injected
        if (!translated.includes(term)) {
          translated = `${translated} (${term})`;
        }
      }
    }

    return {
      translatedText: translated,
      preservedTermsFound: foundPreserved,
    };
  }
}
