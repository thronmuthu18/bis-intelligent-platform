// ─────────────────────────────────────────────────────────────────────────────
//  DEMO DASHBOARD STATS — NOT real data. UI demonstration only.
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeProducts: number;
  pendingActions: number;
  totalDocuments: number;
  overallCompliancePercent: number;
}

export const DEMO_DASHBOARD_STATS: DashboardStats = {
  activeProducts: 3,
  pendingActions: 4,
  totalDocuments: 8,
  overallCompliancePercent: 52,
};

export interface DemoPendingAction {
  id: string;
  title: string;
  description: string;
  productName?: string;
  productId?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'warning' | 'error' | 'info' | 'success';
  dueDate?: string;
}

export const DEMO_PENDING_ACTIONS: DemoPendingAction[] = [
  {
    id: 'pa-1',
    title: 'Documents required',
    description: 'Upload technical specifications and test reports for luminaire housing.',
    productName: 'LED Light Fitting (Type B)',
    productId: 'demo-prod-1',
    priority: 'high',
    type: 'warning',
    dueDate: 'Sep 28',
  },
  {
    id: 'pa-2',
    title: 'Review product information',
    description: 'Confirm aluminium grade specifications and domestic manufacturing premises.',
    productName: 'Domestic Pressure Cooker',
    productId: 'demo-prod-2',
    priority: 'medium',
    type: 'info',
    dueDate: 'Sep 30',
  },
  {
    id: 'pa-3',
    title: 'Testing information required',
    description: 'Select accredited testing facility for industrial impact resistance tests.',
    productName: 'Safety Helmet (Industrial)',
    productId: 'demo-prod-3',
    priority: 'high',
    type: 'warning',
    dueDate: 'Oct 02',
  },
  {
    id: 'pa-4',
    title: 'Compliance task pending',
    description: 'Complete pre-submission audit questionnaire for Scheme-I ISI Mark.',
    productName: 'LED Light Fitting (Type B)',
    productId: 'demo-prod-1',
    priority: 'low',
    type: 'info',
    dueDate: 'Oct 05',
  },
];
