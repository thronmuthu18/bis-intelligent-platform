// ─────────────────────────────────────────────────────────────────────────────
//  ConsumerGuidanceService — Official BIS citizen services & grievance guidance
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ConsumerServiceItem,
  ConsumerGuidanceItem,
  ConsumerServiceType,
} from '@bis/shared';

export class ConsumerGuidanceService {
  /**
   * Official Directory of BIS Citizen & Consumer Services.
   */
  public static getConsumerServices(): ConsumerServiceItem[] {
    return [
      {
        id: 'srv-licence-verify',
        serviceType: 'LICENCE_VERIFICATION',
        title: 'Verify BIS ISI Mark / CRS Licence',
        description:
          'Verify the operational validity, manufacturer details, and scope of any BIS CM/L or CRS registration number before purchasing products.',
        eligibility: 'Open to all Indian consumers and industry stakeholders.',
        requiredInformation: ['7 or 8-digit CM/L Licence Number or CRS Registration Number'],
        officialUrl: 'https://www.manakonline.in/MANAK/certLicenceSearch',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'ShieldCheck',
      },
      {
        id: 'srv-huid-verify',
        serviceType: 'HUID_VERIFICATION',
        title: 'Verify Hallmark Unique Identification (HUID)',
        description:
          'Check the authenticity and purity of 6-digit laser-marked HUID numbers on gold jewellery articles.',
        eligibility: 'All gold jewellery buyers and consumers.',
        requiredInformation: ['6-digit alphanumeric HUID stamped on the jewellery piece'],
        officialUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'Gem',
      },
      {
        id: 'srv-ahc-locator',
        serviceType: 'HALLMARKING',
        title: 'Find Assaying & Hallmarking Centres (AHC)',
        description:
          'Discover BIS-recognized precious metal assaying centres across Indian states for testing and hallmarking verification.',
        eligibility: 'Consumers, registered jewellers, and assaying professionals.',
        requiredInformation: ['State, City, or Pincode'],
        officialUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'MapPin',
      },
      {
        id: 'srv-complaints',
        serviceType: 'CONSUMER_COMPLAINT',
        title: 'Consumer Grievance & Complaint Redressal',
        description:
          'Step-by-step guidance on reporting substandard ISI marked products, fake hallmarks, or misleading quality claims to the BIS Consumer Affairs Department.',
        eligibility: 'Any aggrieved consumer holding a valid purchase invoice or sample evidence.',
        requiredInformation: ['Purchase bill, product photograph, licence/HUID number, seller details'],
        officialUrl: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/complaints',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'AlertTriangle',
      },
      {
        id: 'srv-standards-search',
        serviceType: 'STANDARD_SEARCH',
        title: 'Search Indian Standards (IS)',
        description:
          'Explore published Indian Standards for everyday consumer products, protective gear, building materials, and electronics.',
        eligibility: 'Public domain access.',
        requiredInformation: ['Product keyword or IS Number'],
        officialUrl: 'https://www.standardsbis.in',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'BookOpen',
      },
      {
        id: 'srv-lab-search',
        serviceType: 'LABORATORY_INFORMATION',
        title: 'BIS Laboratory Network & Testing Services',
        description:
          'Information on Central, Regional, and Branch BIS testing laboratories and recognized third-party test facilities.',
        eligibility: 'Public information.',
        requiredInformation: ['Product category or standard number'],
        officialUrl: 'https://www.bis.gov.in/laboratory-services/laboratory-network/',
        sourceAuthority: 'Bureau of Indian Standards (BIS)',
        status: 'ACTIVE',
        lastVerifiedAt: '2026-03-01T00:00:00.000Z',
        iconName: 'FlaskConical',
      },
    ];
  }

  /**
   * Get single service by ID or type.
   */
  public static getServiceById(id: string): ConsumerServiceItem | null {
    const services = this.getConsumerServices();
    return services.find((s) => s.id === id || s.serviceType === id) || null;
  }

  /**
   * Generates structured step-by-step guidance for consumer complaints and services.
   */
  public static getGuidance(serviceType: ConsumerServiceType): ConsumerGuidanceItem {
    switch (serviceType) {
      case 'CONSUMER_COMPLAINT':
        return {
          serviceType: 'CONSUMER_COMPLAINT',
          title: 'Official Guidance: Lodging a BIS Consumer Complaint',
          summary:
            'The Bureau of Indian Standards provides a dedicated grievance redressal mechanism for substandard ISI marked goods, misuse of the BIS Standard Mark, and deceptive hallmarking.',
          guidanceStatus: 'GUIDANCE_ONLY',
          officialPortalUrl: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/complaints',
          officialAppName: 'BIS CARE App',
          officialAppStoreUrl: 'https://apps.apple.com/in/app/bis-care/id1527376378',
          officialPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.bis.mobileapp',
          steps: [
            {
              stepNumber: 1,
              title: 'Preserve Purchase Evidence',
              description:
                'Retain the original purchase tax invoice, packaging with batch number, and clear photographs of the product showing the ISI mark / CM/L number or HUID code.',
              requiredDocuments: ['Tax Invoice / Cash Memo', 'Photographs of Product & Marking'],
            },
            {
              stepNumber: 2,
              title: 'Verify the Licence on BIS CARE',
              description:
                'Open the BIS CARE mobile application and use the "Verify Licence" or "Verify HUID" feature to verify whether the printed licence number is operative.',
              requiredDocuments: ['CM/L Licence Number or 6-digit HUID'],
            },
            {
              stepNumber: 3,
              title: 'File the Grievance through Official Channels',
              description:
                'Submit the grievance via the "Complaints" section of the BIS CARE App or the online BIS Complaint Portal. Select the grievance category (Misuse of ISI Mark / Substandard Quality / Hallmarking).',
              officialActionLink: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/complaints',
            },
            {
              stepNumber: 4,
              title: 'Track Branch Office Investigation',
              description:
                'BIS assigns complaints to the jurisdictional Branch Office (BO). BIS investigating officers may inspect the manufacturer or retailer premises, collect surveillance samples, and issue replacement/refund directives upon laboratory confirmation.',
            },
          ],
          tips: [
            'Never buy gold jewellery without a tax invoice mentioning the 6-digit HUID and weight breakdown.',
            'Look for the ISI mark and 7-8 digit CM/L number before purchasing mandatory goods such as helmets, bottled water, pressure cookers, and LED lights.',
            'You can also email complaints directly to complaints@bis.gov.in.',
          ],
          disclaimers: [
            'This platform provides guidance and decision support only. It does not submit legal complaints on your behalf.',
            'Official complaints must be submitted directly through the BIS CARE App or the official BIS portal.',
          ],
          contacts: [
            { label: 'Toll-Free Consumer Helpline', value: '1800-11-1206' },
            { label: 'BIS Complaints Cell Email', value: 'complaints@bis.gov.in' },
            { label: 'BIS Headquarters Phone', value: '+91-11-23230131' },
          ],
        };

      case 'HUID_VERIFICATION':
      case 'HALLMARKING':
        return {
          serviceType: 'HUID_VERIFICATION',
          title: 'Official Guidance: Verifying Gold & Silver Hallmarks',
          summary:
            'How to ensure you receive authentic, certified gold jewellery conforming to IS 1417 with the mandatory 3 hallmark marks.',
          guidanceStatus: 'GUIDANCE_ONLY',
          officialPortalUrl: 'https://www.manakonline.in/MANAK/hallmarkingSearch',
          officialAppName: 'BIS CARE App',
          officialAppStoreUrl: 'https://apps.apple.com/in/app/bis-care/id1527376378',
          officialPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.bis.mobileapp',
          steps: [
            {
              stepNumber: 1,
              title: 'Check the 3 Mandatory Marks',
              description:
                'Inspect the jewellery with a magnifying loupe to confirm: (1) BIS triangular logo, (2) Purity mark (e.g. 22K916), (3) 6-digit alphanumeric HUID.',
            },
            {
              stepNumber: 2,
              title: 'Verify HUID on the BIS CARE App',
              description:
                'Enter the 6-digit HUID into the BIS CARE App under "Verify HUID". Confirm that the jeweller name, hallmarking centre, and article description match your purchase.',
            },
            {
              stepNumber: 3,
              title: 'Exercise Consumer Testing Right',
              description:
                'If in doubt, any consumer can get hallmarked jewellery tested at any BIS-recognized Assaying & Hallmarking Centre (AHC) for a nominal fee (₹45 per article). If found substandard, the jeweller is legally obligated to refund the difference plus testing charges.',
            },
          ],
          tips: [
            'Always insist on a bill with HUID mentioned for each article.',
            'Old hallmarked jewellery without HUID remains legally valid to sell or melt, but jewellers can only sell newly hallmarked articles with HUID.',
          ],
          disclaimers: [
            'Verification results from this platform are based on available connected records and do not replace laboratory testing.',
          ],
          contacts: [
            { label: 'BIS Hallmarking Department', value: 'hallmarking@bis.gov.in' },
            { label: 'Consumer Helpline', value: '1800-11-1206' },
          ],
        };

      default:
        return {
          serviceType,
          title: `Official Guidance for ${serviceType.replace(/_/g, ' ')}`,
          summary:
            'Official assistance and guidance for accessing Bureau of Indian Standards citizen services.',
          guidanceStatus: 'GUIDANCE_ONLY',
          officialPortalUrl: 'https://www.bis.gov.in',
          steps: [
            {
              stepNumber: 1,
              title: 'Identify Requirement',
              description: 'Determine the applicable Indian Standard or service requirement.',
            },
            {
              stepNumber: 2,
              title: 'Access Official BIS Portal',
              description: 'Visit manakonline.in or bis.gov.in to initiate official service requests.',
              officialActionLink: 'https://www.manakonline.in',
            },
          ],
          tips: ['Ensure all product and licence details are accurate before submitting inquiries.'],
          disclaimers: [
            'This platform provides structured information and does not represent an official BIS submission.',
          ],
        };
    }
  }
}
