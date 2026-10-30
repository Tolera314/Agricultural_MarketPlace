'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Check,
  ShieldCheck,
  Phone,
  RefreshCw,
  Sparkles,
  Store,
  ChevronLeft,
} from 'lucide-react';
import { messageApi, ConversationSummary, ChatMessageItem } from '@/lib/messageApi';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface BuyerChatViewProps {
  initialFarmerId?: string | null;
  onClearInitialFarmer?: () => void;
  onNavigateToFarmers?: () => void;
}

export function BuyerChatView({
  initialFarmerId,
  onClearInitialFarmer,
  onNavigateToFarmers,
}: BuyerChatViewProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [activePartner, setActivePartner] = useState<any | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations list
  const loadConversations = useCallback(async (autoSelectId?: string) => {
    try {
      const list = await messageApi.getConversations();
      setConversations(list || []);

      if (autoSelectId) {
        setSelectedConversationId(autoSelectId);
      } else if (!selectedConversationId && list && list.length > 0) {
        setSelectedConversationId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [selectedConversationId]);

  // Initial load or handling initialFarmerId query param
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoadingConversations(true);
      try {
        if (initialFarmerId) {
          // Find or create conversation with this farmer
          const res = await messageApi.startOrGetConversation(initialFarmerId);
          if (isMounted && res?.data?.id) {
            setSelectedConversationId(res.data.id);
            setMobileShowThread(true);
            await loadConversations(res.data.id);
            if (onClearInitialFarmer) onClearInitialFarmer();
            return;
          }
        }
        if (isMounted) {
          await loadConversations();
        }
      } catch (err) {
        console.error('Failed to initialize conversation with farmer:', err);
        if (isMounted) await loadConversations();
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [initialFarmerId, loadConversations, onClearInitialFarmer]);

  // 2. Fetch messages for selected conversation
  const loadMessages = useCallback(async (convId: string, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await messageApi.getConversationMessages(convId);
      if (res && res.messages) {
        setMessages(res.messages);
        setActivePartner(res.conversation);
        if (!isSilent) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
      setActivePartner(null);
    }
  }, [selectedConversationId, loadMessages]);

  // Polling for new incoming messages every 4 seconds
  useEffect(() => {
    if (!selectedConversationId) return;

    const interval = setInterval(() => {
      loadMessages(selectedConversationId, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedConversationId, loadMessages]);

  // 3. Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversationId || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic message append
    const tempMessage: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversationId,
      senderId: 'me',
      content: textToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const saved = await messageApi.sendMessage(selectedConversationId, textToSend);
      // Replace temp message with server saved message
      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? saved : m)));
      // Refresh conversation summary
      loadConversations(selectedConversationId);
    } catch (err: any) {
      alert(err?.message || 'Failed to send message. Please try again.');
      // Revert temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInputText(textToSend);
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.partnerName?.toLowerCase().includes(q) ||
      c.partnerFarmName?.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-[#0D221A] rounded-2xl border border-[#E5EDE7] dark:border-[#132A20] shadow-xs overflow-hidden flex flex-col h-[650px] max-h-[80vh]">
      {/* Container Header */}
      <div className="px-5 py-3.5 border-b border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-[#1E2923] dark:text-white flex items-center gap-2">
              Direct Farmer Communications
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                Verified
              </span>
            </h2>
            <p className="text-[11px] text-[#517663] dark:text-[#88B8A0]">
              Inquire about produce freshness, reserve bulk harvests, and coordinate local pickups
            </p>
          </div>
        </div>

        <button
          onClick={() => loadConversations(selectedConversationId || undefined)}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
          title="Refresh messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div
          className={`${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 border-r border-[#E5EDE7] dark:border-[#132A20] flex-col bg-[#FBFDFB] dark:bg-[#0B1E16] shrink-0`}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-[#E5EDE7] dark:border-[#132A20]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search growers & messages..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0D221A] border border-[#E5EDE7] dark:border-[#132A20] focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5EDE7]/60 dark:divide-[#132A20]">
            {loadingConversations ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <Store className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  No active conversations yet
                </p>
                {onNavigateToFarmers && (
                  <button
                    onClick={onNavigateToFarmers}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                  >
                    Browse Farmers Directory
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setMobileShowThread(true);
                    }}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <UserAvatar
                      src={conv.partnerAvatarUrl}
                      name={conv.partnerName}
                      size="md"
                      className="w-10 h-10 rounded-2xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#1E2923] dark:text-white truncate">
                          {conv.partnerFarmName || conv.partnerName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#517663] dark:text-[#88B8A0] font-medium truncate mt-0.5">
                        {conv.partnerName}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessageText || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Active Thread */}
        <div
          className={`${
            mobileShowThread ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-white dark:bg-[#0D221A]`}
        >
          {selectedConversationId && activePartner ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="p-3.5 border-b border-[#E5EDE7] dark:border-[#132A20] flex items-center justify-between bg-white dark:bg-[#0D221A]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <UserAvatar
                    src={activePartner.partnerAvatarUrl}
                    name={activePartner.partnerName}
                    size="md"
                    className="w-10 h-10 rounded-2xl"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#1E2923] dark:text-white">
                        {activePartner.partnerFarmName || activePartner.partnerName}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full border border-emerald-200/50">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified Grower
                      </span>
                    </div>
                    <p className="text-[11px] text-[#517663] dark:text-[#88B8A0]">
                      Operated by {activePartner.partnerName}
                      {activePartner.partnerPhone ? ` • ${activePartner.partnerPhone}` : ''}
                    </p>
                  </div>
                </div>

                {activePartner.partnerPhone && (
                  <a
                    href={`tel:${activePartner.partnerPhone}`}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 text-xs font-semibold border border-gray-200 dark:border-white/5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Grower</span>
                  </a>
                )}
              </div>

              {/* Message Bubbles Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAFBFB] dark:bg-[#0A1A14]">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-gray-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-xs text-[#1E2923] dark:text-white">Start the conversation</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Say hello to {activePartner.partnerName}. Ask about harvest readiness, pricing, or order logistics.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId !== activePartner.partnerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#059669] text-white rounded-tr-xs'
                              : 'bg-white dark:bg-[#11241B] text-[#1E2923] dark:text-white rounded-tl-xs border border-[#E5EDE7] dark:border-white/5'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-gray-400">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[#E5EDE7] dark:border-[#132A20] flex items-center gap-2 bg-white dark:bg-[#0D221A]"
              >
                <input
                  type="text"
                  placeholder={`Write a message to ${activePartner.partnerName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#F4F7F5] dark:bg-[#0A1A14] border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-[#0D221A] text-xs sm:text-sm focus:outline-none text-[#1E2923] dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
              <h3 className="font-bold text-sm text-[#1E2923] dark:text-white">
                Select a Farmer Conversation
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Choose a conversation from the left pane or click &quot;Talk with Farmer&quot; on any grower card in the directory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

