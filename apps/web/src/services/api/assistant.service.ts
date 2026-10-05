import { apiClient } from './client';
import type {
  AssistantConversation,
  AssistantQueryResponse,
  CreateConversationInput,
  SendAssistantMessageInput,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Assistant Service
//  Calls backend /api/v1/products/:id/assistant endpoints.
//  Safely handles both unwrapped data from apiClient and legacy wrapped envelopes.
// ─────────────────────────────────────────────────────────────────────────────

export interface AssistantConversationsResponse {
  conversations: AssistantConversation[];
}

export interface AssistantConversationResponse {
  conversation: AssistantConversation;
}

export const assistantService = {
  /**
   * Retrieves all assistant conversations for a specific product.
   */
  async getConversations(productId: string): Promise<AssistantConversation[]> {
    const raw = await apiClient.get<
      AssistantConversation[] | { conversations?: AssistantConversation[]; data?: AssistantConversation[] }
    >(`/products/${productId}/assistant/conversations`);

    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === 'object') {
      if (Array.isArray((raw as any).conversations)) {
        return (raw as any).conversations;
      }
      if (Array.isArray((raw as any).data)) {
        return (raw as any).data;
      }
    }
    return [];
  },

  /**
   * Creates a new assistant conversation for a product.
   */
  async createConversation(
    productId: string,
    input: CreateConversationInput = {}
  ): Promise<AssistantConversation> {
    const raw = await apiClient.post<
      AssistantConversation | { conversation?: AssistantConversation; data?: AssistantConversation }
    >(`/products/${productId}/assistant/conversations`, input);

    if (raw && typeof raw === 'object') {
      if ('conversation' in raw && (raw as any).conversation) {
        return (raw as any).conversation;
      }
      if ('data' in raw && (raw as any).data && typeof (raw as any).data === 'object') {
        return (raw as any).data;
      }
    }
    return raw as AssistantConversation;
  },

  /**
   * Retrieves full conversation details including all messages and citations.
   */
  async getConversation(
    productId: string,
    conversationId: string
  ): Promise<AssistantConversation> {
    const raw = await apiClient.get<
      AssistantConversation | { conversation?: AssistantConversation; data?: AssistantConversation }
    >(`/products/${productId}/assistant/conversations/${conversationId}`);

    if (raw && typeof raw === 'object') {
      if ('conversation' in raw && (raw as any).conversation) {
        return (raw as any).conversation;
      }
      if ('data' in raw && (raw as any).data && typeof (raw as any).data === 'object') {
        return (raw as any).data;
      }
    }
    return raw as AssistantConversation;
  },

  /**
   * Sends a message to an existing conversation and receives the grounded assistant response.
   */
  async sendMessage(
    productId: string,
    conversationId: string,
    input: SendAssistantMessageInput
  ): Promise<AssistantQueryResponse> {
    const raw = await apiClient.post<
      AssistantQueryResponse | { data?: AssistantQueryResponse }
    >(`/products/${productId}/assistant/conversations/${conversationId}/messages`, input);

    if (raw && typeof raw === 'object' && 'data' in raw && (raw as any).data?.message) {
      return (raw as any).data;
    }
    return raw as AssistantQueryResponse;
  },
};
