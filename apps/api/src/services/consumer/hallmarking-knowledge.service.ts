// ─────────────────────────────────────────────────────────────────────────────
//  HallmarkingKnowledgeService — Source-grounded hallmarking intelligence
// ─────────────────────────────────────────────────────────────────────────────

export interface HallmarkingConcept {
  id: string;
  topic: string;
  title: string;
  summary: string;
  details: string[];
  applicableStandard?: string;
  officialSource: string;
  sourceUrl: string;
  authority: string;
  isVerified: boolean;
}

export interface HallmarkSignsExplanation {
  signNumber: number;
  name: string;
  description: string;
  visualGuidance: string;
  officialReference: string;
}

export class HallmarkingKnowledgeService {
  /**
   * Authoritative Hallmarking Concepts grounded in BIS Hallmarking Regulations (2018)
   * and IS 1417 (Gold) / IS 2112 (Silver).
   */
  public static getHallmarkingConcepts(): HallmarkingConcept[] {
    return [
      {
        id: 'concept-huid',
        topic: 'HUID (Hallmark Unique Identification)',
        title: 'Understanding 6-Digit Alphanumeric HUID',
        summary:
          'HUID is a unique 6-digit alphanumeric identification code laser-marked on every hallmarked gold jewellery article at BIS-recognized Assaying & Hallmarking Centres (AHC).',
        details: [
          'Mandatory on gold jewellery from April 1, 2023 under the BIS Hallmarking Scheme.',
          'Enables consumers to track authenticity, purity, jeweller registration, and testing centre code using the BIS CARE App.',
          'Each jewellery piece receives an individual, non-transferable HUID code after passing non-destructive XRF and destructive Fire Assay sampling.',
        ],
        applicableStandard: 'IS 1417:2016',
        officialSource: 'Bureau of Indian Standards Hallmarking Regulations & Gazette SO 1541(E)',
        sourceUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
        authority: 'Bureau of Indian Standards (BIS)',
        isVerified: true,
      },
      {
        id: 'concept-gold-standards',
        topic: 'Gold Purity & Fineness',
        title: 'Permissible Purity Karats under IS 1417',
        summary:
          'Under Indian Standard IS 1417, hallmarking is permitted for specific gold purities with corresponding parts per thousand (ppt/ppm) fineness marks.',
        details: [
          '24 Karat (995 / 999): Pure gold bullion and artefacts.',
          '23 Karat (958): 95.8% pure gold.',
          '22 Karat (916): 91.6% pure gold — most widely used for Indian traditional jewellery.',
          '20 Karat (833): 83.3% pure gold.',
          '18 Karat (750): 75.0% pure gold — commonly used for diamond and gem-set jewellery.',
          '14 Karat (585): 58.5% pure gold — used for lightweight and contemporary jewellery.',
          '9 Karat (375): 37.5% pure gold.',
        ],
        applicableStandard: 'IS 1417:2016',
        officialSource: 'IS 1417:2016 (Gold and Gold Alloys, Jewellery/Artefacts - Fineness and Marking)',
        sourceUrl: 'https://www.standardsbis.in',
        authority: 'Bureau of Indian Standards (BIS)',
        isVerified: true,
      },
      {
        id: 'concept-silver-standards',
        topic: 'Silver Fineness & Marking',
        title: 'Silver Hallmarking under IS 2112',
        summary:
          'Silver jewellery and artefacts are hallmarked under IS 2112 to certify standard fineness grades.',
        details: [
          '990: Fine silver (99.0% purity).',
          '925: Sterling silver (92.5% purity) — international standard for silverware and jewellery.',
          '900: Coin silver (90.0% purity).',
          '835: European standard silver (83.5% purity).',
          '800: German silver standard (80.0% purity).',
        ],
        applicableStandard: 'IS 2112:2014',
        officialSource: 'IS 2112:2014 (Silver and Silver Alloys, Jewellery/Artefacts - Fineness and Marking)',
        sourceUrl: 'https://www.standardsbis.in',
        authority: 'Bureau of Indian Standards (BIS)',
        isVerified: true,
      },
      {
        id: 'concept-ahc-process',
        topic: 'Assaying & Hallmarking Centres (AHC)',
        title: 'Testing and Laser Inscription Process at AHC',
        summary:
          'BIS-recognized Assaying and Hallmarking Centres act as neutral testing institutions to verify jewellery fineness before laser marking.',
        details: [
          'Sample reception and non-destructive preliminary X-Ray Fluorescence (XRF) screening.',
          'Destructive Fire Assay testing (Cupellation method as per IS 1418) on representative samples.',
          'Laser inscription of the 3 hallmark marks on certified compliant batches.',
        ],
        applicableStandard: 'IS 1418:2009',
        officialSource: 'BIS Guidelines for Recognition and Operation of Assaying and Hallmarking Centres',
        sourceUrl: 'https://www.manakonline.in',
        authority: 'Bureau of Indian Standards (BIS)',
        isVerified: true,
      },
      {
        id: 'concept-jeweller-registration',
        topic: 'Jeweller Registration & Obligations',
        title: 'Mandatory Registration and Consumer Bill Rights',
        summary:
          'All jewellers selling gold jewellery in mandatory hallmarking districts must hold a valid BIS registration.',
        details: [
          'One-time automated registration process with zero government registration fee for micro-jewellers.',
          'The jeweller is legally obligated to provide a detailed bill specifying the article, gross weight, net gold weight, purity karat, and HUID.',
          'Consumers have the right to have their hallmarked jewellery re-tested at any BIS-recognized AHC for a nominal fee (approx. ₹45 per article).',
        ],
        officialSource: 'BIS Hallmarking (Amendment) Regulations',
        sourceUrl: 'https://www.manakonline.in',
        authority: 'Bureau of Indian Standards (BIS)',
        isVerified: true,
      },
    ];
  }

  /**
   * The 3 Mandatory Signs on BIS Hallmarked Gold Jewellery (Post April 2023).
   */
  public static getMandatoryHallmarkSigns(): HallmarkSignsExplanation[] {
    return [
      {
        signNumber: 1,
        name: 'BIS Standard Mark (Triangle Logo)',
        description:
          'The official triangular logo of the Bureau of Indian Standards certifying that the item conforms to Indian Standards.',
        visualGuidance: 'Stylized triangular mark with the BIS letters inside.',
        officialReference: 'BIS Hallmarking Scheme, Clause 4.1',
      },
      {
        signNumber: 2,
        name: 'Purity / Fineness Grade',
        description:
          'Indicates the karat and parts per thousand purity of gold (e.g., 22K916, 18K750, 14K585).',
        visualGuidance: 'Numbers clearly stamped alongside karat denomination, e.g. "22K916".',
        officialReference: 'IS 1417:2016 Clause 5.2',
      },
      {
        signNumber: 3,
        name: '6-Digit Alphanumeric HUID',
        description:
          'Unique laser-engraved identification code that can be verified on the official BIS CARE mobile application.',
        visualGuidance: 'Six distinct alphanumeric characters, e.g., "AZ1234", "9B7K2M".',
        officialReference: 'Gazette of India Notification S.O. 1541(E)',
      },
    ];
  }
}
