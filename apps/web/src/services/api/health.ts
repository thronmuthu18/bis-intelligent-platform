import { apiClient } from './client';

// ─────────────────────────────────────────────────────────────────────────────
//  Health API
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
}

export async function checkApiHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health');
}
