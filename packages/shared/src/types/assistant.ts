// ─────────────────────────────────────────────────────────────────────────────
//  Phase 16 — Assistant & User Activity Contracts
// ─────────────────────────────────────────────────────────────────────────────

import { AuthorityLevel } from './standard.js';

export type AssistantRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface AssistantCitation {
  citationIndex: number;
  standardId?: string;
  isNumber?: string;
  sourceTitle: string;
  sourceUrl?: string;
  authorityLevel: AuthorityLevel;
  documentType?: string;
  clauseOrSection?: string;
  relevanceScore?: number;
}

export interface AssistantMessage {
  id: string;
  conversationId: string;
  role: AssistantRole;
  content: string;
  citations?: AssistantCitation[];
  grounded: boolean;
  confidenceScore?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  productId?: string | null;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: AssistantMessage[];
  lastMessage?: AssistantMessage;
}

export interface CreateConversationInput {
  title?: string;
  initialMessage?: string;
}

export interface SendAssistantMessageInput {
  content: string;
  includeProductContext?: boolean;
}

export interface AssistantQueryResponse {
  conversationId: string;
  message: AssistantMessage;
  grounded: boolean;
  citations: AssistantCitation[];
  evidenceCount: number;
}

export type ActivityCategory =
  | 'PRODUCT'
  | 'DOCUMENT'
  | 'COMPLIANCE'
  | 'ASSISTANT'
  | 'SYSTEM';

export interface UserActivityItem {
  id: string;
  userId?: string | null;
  productId?: string | null;
  productName?: string | null;
  category: ActivityCategory;
  action: string;
  title: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface UserActivityFeedResponse {
  activities: UserActivityItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserActivityQueryInput {
  page?: number;
  limit?: number;
  category?: ActivityCategory | 'ALL';
  productId?: string;
}
