import type { ConsumerExplanation, SupportedLanguage } from '@bis/shared';

export class ConsumerExplanationService {
  /**
   * Generates a deterministic 5-part consumer-friendly explanation for a standard or product rule
   * in English, Tamil, or Hindi.
   */
  public static generateExplanation(params: {
    standardNumber: string;
    title: string;
    scope?: string | null;
    isMandatoryQco?: boolean;
    qcoName?: string | null;
    sourceUrl?: string | null;
    language?: SupportedLanguage;
  }): ConsumerExplanation {
    const isQco = Boolean(params.isMandatoryQco);
    const standard = params.standardNumber;
    const title = params.title;
    const lang = params.language || 'en';

    // Tamil Explanations
    if (lang === 'ta') {
      let whatThisMeans = `இந்திய தரநிலை ${standard} ${title}க்கான அத்தியாவசிய பாதுகாப்பு, செயல்திறன் மற்றும் உற்பத்தித் தரத் தேவைகளை நிறுவுகிறது.`;
      if (isQco) {
        whatThisMeans += ` ${params.qcoName || 'தரக் கட்டுப்பாட்டு உத்தரவு (QCO)'} கீழ், இந்தியாவில் விற்பனை செய்வதற்கு BIS ISI முத்திரை சட்டப்பூர்வமாகக் கட்டாயமாகும்.`;
      }

      let whyItMatters = `${standard} தரநிலைக்கு ஏற்ப பரிசோதிக்கப்பட்ட தயாரிப்புகள் நுகர்வோரை மின்சார, இயந்திர மற்றும் வேதியியல் ஆபத்துகளிலிருந்து பாதுகாக்கின்றன.`;
      if (title.toLowerCase().includes('led') || title.toLowerCase().includes('lamp') || title.toLowerCase().includes('luminaire') || title.toLowerCase().includes('lighting')) {
        whyItMatters = `${standard} தரநிலைக்கு இணங்கும் விளக்கு உபகரணங்கள் மின் அதிர்ச்சி மற்றும் தீ விபத்து அபாயங்களைத் தடுக்கின்றன.`;
      } else if (title.toLowerCase().includes('helmet')) {
        whyItMatters = `${standard} தரநிலைக்கு இணங்கும் தலைக்கவசங்கள் சாலை விபத்துகளின் போது உயிர்களைக் காக்கின்றன.`;
      } else if (title.toLowerCase().includes('gold') || title.toLowerCase().includes('hallmark')) {
        whyItMatters = `${standard} கீழ் தங்கம் ஹால்மார்க்கிங் செய்யப்படுவது சான்றளிக்கப்பட்ட தங்கத்தின் தூய்மையை உத்தரவாதம் செய்கிறது.`;
      }

      const whatYouCanCheck: string[] = [
        `தயாரிப்பு பேக்கேஜிங்கில் அசல் BIS ISI முத்திரை அச்சிடப்பட்டுள்ளதா என்பதைச் சரிபார்க்கவும்.`,
        `ISI முத்திரையின் கீழ் அச்சிடப்பட்டுள்ள 7 அல்லது 8 இலக்க CM/L உரிம எண்ணை BIS CARE App மூலம் சரிபார்க்கவும்.`,
        `லேபிளில் உள்ள பிராண்ட் பெயர் மற்றும் உற்பத்தியாளர் முகவரி அதிகாரப்பூர்வ BIS விவரங்களுடன் பொருந்துகிறதா என்பதை உறுதிப்படுத்தவும்.`,
      ];

      const officialSource = `இந்திய தர நிர்ணய பணியகம் (BIS) — ${standard} (${title})`;
      const sourceUrl = params.sourceUrl || 'https://www.standardsbis.in';
      const nextStep = isQco
        ? `BIS CARE செயலியில் தயாரிப்பின் CM/L உரிம எண்ணைச் சரிபார்க்கவும் அல்லது புகார்களை BIS-க்கு தெரிவிக்கவும்.`
        : `வாங்குவதற்கு முன் தயாரிப்பு லேபிளில் ISI முத்திரையைச் சரிபார்க்கவும்.`;

      return {
        whatThisMeans,
        whyItMatters,
        whatYouCanCheck,
        officialSource,
        sourceUrl,
        nextStep,
      };
    }

    // Hindi Explanations
    if (lang === 'hi') {
      let whatThisMeans = `भारतीय मानक ${standard} ${title} के लिए आवश्यक सुरक्षा, प्रदर्शन और विनिर्माण गुणवत्ता आवश्यकताओं को स्थापित करता है।`;
      if (isQco) {
        whatThisMeans += ` ${params.qcoName || 'गुणवत्ता नियंत्रण आदेश (QCO)'} के तहत, भारत में बिक्री के लिए BIS ISI मार्क कानूनी रूप से अनिवार्य है।`;
      }

      let whyItMatters = `${standard} के अनुसार प्रमाणित उत्पाद उपभोक्ताओं को बिजली, यांत्रिक या रासायनिक खतरों से बचाते हैं।`;
      if (title.toLowerCase().includes('led') || title.toLowerCase().includes('lamp') || title.toLowerCase().includes('luminaire') || title.toLowerCase().includes('lighting')) {
        whyItMatters = `${standard} का पालन करने वाले प्रकाश उपकरण बिजली के झटके और आग के खतरों को रोकते हैं।`;
      } else if (title.toLowerCase().includes('helmet')) {
        whyItMatters = `${standard} के अनुरूप सुरक्षात्मक हेलमेट सड़क दुर्घटनाओं के दौरान जान बचाते हैं।`;
      } else if (title.toLowerCase().includes('gold') || title.toLowerCase().includes('hallmark')) {
        whyItMatters = `${standard} के तहत स्वर्ण हॉलमार्किंग प्रमाणित शुद्धता की गारंटी देती है।`;
      }

      const whatYouCanCheck: string[] = [
        `उत्पाद पैकेजिंग पर मुद्रित प्रामाणिक BIS ISI मार्क की जांच करें।`,
        `BIS CARE App का उपयोग करके ISI मार्क के नीचे मुद्रित 7 या 8 अंकों के CM/L लाइसेंस नंबर का सत्यापन करें।`,
        `पुष्टि करें कि लेबल पर ब्रांड नाम और निर्माता का पता आधिकारिक BIS पंजीकृत विवरण से मेल खाता है।`,
      ];

      const officialSource = `भारतीय मानक ब्यूरो (BIS) — ${standard} (${title})`;
      const sourceUrl = params.sourceUrl || 'https://www.standardsbis.in';
      const nextStep = isQco
        ? `BIS CARE App पर उत्पाद के CM/L लाइसेंस नंबर का सत्यापन करें या BIS को गैर-अनुपालन की रिपोर्ट करें।`
        : `खरीदने से पहले उत्पाद लेबल पर ISI मार्क की जांच करें।`;

      return {
        whatThisMeans,
        whyItMatters,
        whatYouCanCheck,
        officialSource,
        sourceUrl,
        nextStep,
      };
    }

    // English Default
    let whatThisMeans = `Indian Standard ${standard} establishes essential safety, performance, and manufacturing quality requirements for ${title.toLowerCase()}.`;
    if (isQco) {
      whatThisMeans += ` Under the ${params.qcoName || 'applicable Quality Control Order (QCO)'}, compliance and the BIS Standard Mark (ISI mark) are legally mandatory for sale in India.`;
    }

    let whyItMatters = `Products tested and certified against ${standard} protect consumers from electrical, mechanical, or chemical hazards and ensure long-term durability.`;
    if (title.toLowerCase().includes('led') || title.toLowerCase().includes('lamp') || title.toLowerCase().includes('luminaire') || title.toLowerCase().includes('lighting')) {
      whyItMatters = `LED products adhering to ${standard} prevent electrical shock risks, fire hazards, and excessive harmonic distortion while guaranteeing specified illumination and thermal safety.`;
    } else if (title.toLowerCase().includes('helmet')) {
      whyItMatters = `Protective helmets conforming to ${standard} undergo rigorous impact absorption, retention system, and penetration resistance tests to save lives during road accidents.`;
    } else if (title.toLowerCase().includes('gold') || title.toLowerCase().includes('hallmark')) {
      whyItMatters = `Gold hallmarking under ${standard} protects buyers from paying for higher purity while receiving substandard gold alloy, guaranteeing certified fineness.`;
    } else if (title.toLowerCase().includes('water') || title.toLowerCase().includes('bottle') || title.toLowerCase().includes('container')) {
      whyItMatters = `Containers and water bottles complying with ${standard} ensure food-grade safety, non-toxicity, and absence of hazardous heavy metal leaching.`;
    }

    const whatYouCanCheck: string[] = [
      `Look for the authentic BIS Standard Mark (ISI logo) printed or embossed on the product packaging.`,
      `Verify the 7-digit or 8-digit CM/L licence number printed directly beneath the ISI mark using the BIS CARE App.`,
      `Confirm that the brand name and manufacturer address on the label match the official BIS registered licence details.`,
    ];

    if (isQco) {
      whatYouCanCheck.push(`Ensure the product does not bear "Non-ISI" or "Export only" disclaimers when purchased in the Indian domestic retail market.`);
    }

    const officialSource = `Bureau of Indian Standards — ${standard} (${title})`;
    const sourceUrl = params.sourceUrl || 'https://www.standardsbis.in';

    const nextStep = isQco
      ? `Verify the product's CM/L licence number on the BIS CARE App or report uncertified non-compliant stock to the BIS Consumer Affairs Department.`
      : `Check the product label for the voluntary or mandatory ISI mark before purchase.`;

    return {
      whatThisMeans,
      whyItMatters,
      whatYouCanCheck,
      officialSource,
      sourceUrl,
      nextStep,
    };
  }
}

