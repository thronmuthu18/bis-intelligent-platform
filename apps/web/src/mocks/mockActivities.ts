// ─────────────────────────────────────────────────────────────────────────────
//  DEMO ACTIVITY DATA — NOT real data. UI demonstration only.
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityCategory = 'PRODUCT' | 'DOCUMENT' | 'COMPLIANCE' | 'SYSTEM';

export interface DemoActivity {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  user: string;
  productName?: string;
  timestamp: string;
}

export const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 'act-1',
    category: 'DOCUMENT',
    title: 'Document uploaded',
    description: 'Technical_Datasheet_v2.pdf uploaded for verification.',
    user: 'Compliance Officer',
    productName: 'LED Light Fitting (Type B)',
    timestamp: '2 hours ago',
  },
  {
    id: 'act-2',
    category: 'COMPLIANCE',
    title: 'Compliance stage updated',
    description: 'Moved from Information Collection to Document Collection.',
    user: 'Regulatory Lead',
    productName: 'Domestic Pressure Cooker',
    timestamp: 'Yesterday at 3:45 PM',
  },
  {
    id: 'act-3',
    category: 'PRODUCT',
    title: 'Product created',
    description: 'Safety Helmet (Industrial) registered in compliance workspace.',
    user: 'Plant Manager',
    productName: 'Safety Helmet (Industrial)',
    timestamp: '2 days ago',
  },
  {
    id: 'act-4',
    category: 'COMPLIANCE',
    title: 'Standards mapping initiated',
    description: 'AI recommendation workspace generated standard candidates.',
    user: 'Compliance Assistant',
    productName: 'LED Light Fitting (Type B)',
    timestamp: '3 days ago',
  },
  {
    id: 'act-5',
    category: 'DOCUMENT',
    title: 'Quality manual uploaded',
    description: 'ISO9001_Quality_Manual.pdf added to organizational documents.',
    user: 'QA Engineer',
    productName: 'Domestic Pressure Cooker',
    timestamp: '4 days ago',
  },
  {
    id: 'act-6',
    category: 'SYSTEM',
    title: 'Organization profile updated',
    description: 'Udyam MSME registration details verified.',
    user: 'Admin',
    timestamp: '5 days ago',
  },
];
