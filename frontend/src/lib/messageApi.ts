'use client';

import { getAccessToken } from './auth';
import { API_BASE_URL } from './apiConfig';
import { safeParseApiResponse, ApiClientError, getHumanReadableErrorMessage } from './errorHandler';

export interface ChatSender {
  id: string;
  fullName: string;
  role: string;
  userProfile?: {
    avatarUrl?: string | null;
  } | null;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: ChatSender;
}

export interface ConversationSummary {
  id: string;
  buyerId: string;
  farmerId: string;
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  partnerPhone?: string | null;
  partnerAvatarUrl?: string | null;
  partnerFarmName?: string;
  partnerVerificationStatus?: string;
  lastMessageText?: string | null;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ConversationDetail {
  conversation: {
    id: string;
    buyerId: string;
    farmerId: string;
    partnerId: string;
    partnerName: string;
    partnerPhone?: string | null;
    partnerAvatarUrl?: string | null;
    partnerFarmName?: string;
    partnerVerificationStatus?: string;
    createdAt: string;
  };
  messages: ChatMessageItem[];
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (netErr: any) {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: getHumanReadableErrorMessage(netErr),
      status: 0,
    });
  }

  const parsed = await safeParseApiResponse<T>(res);
  if (!parsed.ok) {
    throw new ApiClientError(
      parsed.error || {
        message: getHumanReadableErrorMessage(res.status),
        status: res.status,
      }
    );
  }

  return parsed.data as T;
}

export const messageApi = {
  startOrGetConversation(farmerId: string, initialMessage?: string): Promise<any> {
    return apiFetch<any>('/api/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ farmerId, initialMessage }),
    });
  },

  getConversations(): Promise<ConversationSummary[]> {
    return apiFetch<ConversationSummary[]>('/api/messages/conversations');
  },

  getConversationMessages(conversationId: string): Promise<ConversationDetail> {
    return apiFetch<ConversationDetail>(`/api/messages/conversations/${encodeURIComponent(conversationId)}`);
  },

  sendMessage(conversationId: string, content: string): Promise<ChatMessageItem> {
    return apiFetch<ChatMessageItem>(`/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  markAsRead(conversationId: string): Promise<{ readCount: number }> {
    return apiFetch<{ readCount: number }>(`/api/messages/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'PATCH',
    });
  },
};

