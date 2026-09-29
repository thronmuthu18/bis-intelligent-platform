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
    const res = await apiClient.get<AssistantConversationsResponse>(
      `/products/${productId}/assistant/conversations`
    );
    return res.conversations;
  },

  /**
   * Creates a new assistant conversation for a product.
   */
  async createConversation(
    productId: string,
    input: CreateConversationInput = {}
  ): Promise<AssistantConversation> {
    const res = await apiClient.post<AssistantConversationResponse>(
      `/products/${productId}/assistant/conversations`,
      input
    );
    return res.conversation;
  },

  /**
   * Retrieves full conversation details including all messages and citations.
   */
  async getConversation(
    productId: string,
    conversationId: string
  ): Promise<AssistantConversation> {
    const res = await apiClient.get<AssistantConversationResponse>(
      `/products/${productId}/assistant/conversations/${conversationId}`
    );
    return res.conversation;
  },

  /**
   * Sends a message to an existing conversation and receives the grounded assistant response.
   */
  async sendMessage(
    productId: string,
    conversationId: string,
    input: SendAssistantMessageInput
  ): Promise<AssistantQueryResponse> {
    const res = await apiClient.post<AssistantQueryResponse>(
      `/products/${productId}/assistant/conversations/${conversationId}/messages`,
      input
    );
    return res;
  },
};
