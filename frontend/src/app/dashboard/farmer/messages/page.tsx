'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Search,
  CheckCheck,
  Check,
  Menu,
  RefreshCw,
  Sparkles,
  Users,
  ChevronLeft,
} from 'lucide-react';
import { messageApi, ConversationSummary, ChatMessageItem } from '@/lib/messageApi';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default function FarmerMessagesPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [activePartner, setActivePartner] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      console.error('Failed to load farmer conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await messageApi.getConversationMessages(convId);
      if (res && res.messages) {
        setMessages(res.messages);
        setActivePartner(res.conversation);
        if (!isSilent) setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
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

  // Polling every 4s
  useEffect(() => {
    if (!selectedConversationId) return;
    const interval = setInterval(() => {
      loadMessages(selectedConversationId, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConversationId, loadMessages]);

  const handleSend = async () => {
    if (!selectedConversationId || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

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
      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? saved : m)));
      loadConversations(selectedConversationId);
    } catch (err: any) {
      alert(err?.message || 'Failed to send message.');
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
      c.lastMessageText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#173F35] dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Direct Buyer & Courier Inquiries
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Communicate with buyers, confirm pickup times, and coordinate dispatch
            </p>
          </div>
        </div>

        <button
          onClick={() => loadConversations(selectedConversationId || undefined)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col md:flex-row gap-4">
        {/* Left: Chat list */}
        <div
          className={`${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xs shrink-0`}
        >
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading inquiries...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No buyer messages yet</p>
                <p className="text-[11px] text-gray-400">
                  When verified buyers inquire about your harvests, their messages will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedConversationId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConversationId(c.id);
                      setMobileShowThread(true);
                    }}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <UserAvatar
                      src={c.partnerAvatarUrl}
                      name={c.partnerName}
                      size="md"
                      className="w-10 h-10 rounded-2xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="font-bold text-xs text-gray-800 dark:text-white truncate">
                          {c.partnerName}
                        </div>
                        {c.lastMessageAt && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.partnerRole === 'BUYER' ? 'Agricultural Buyer' : c.partnerRole}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {c.lastMessageText || 'No message content'}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shrink-0">
                            {c.unreadCount}
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

        {/* Right: Active Chat Window */}
        <div
          className={`${
            mobileShowThread ? 'flex' : 'hidden md:flex'
          } flex-1 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xs`}
        >
          {selectedConversationId && activePartner ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0D2118]">
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
                    <div className="font-extrabold text-sm text-gray-800 dark:text-white">
                      {activePartner.partnerName}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {activePartner.partnerRole === 'BUYER' ? 'Registered Buyer' : 'Courier'}
                      {activePartner.partnerPhone ? ` • ${activePartner.partnerPhone}` : ''}
                    </div>
                  </div>
                </div>

                {activePartner.partnerPhone && (
                  <a
                    href={`tel:${activePartner.partnerPhone}`}
                    className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFBFB] dark:bg-[#0A1A14]">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-gray-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Sparkles className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-bold text-xs text-gray-800 dark:text-white">No messages yet</p>
                    <p className="text-[11px] text-gray-400">
                      Send a message to coordinate with {activePartner.partnerName}.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId !== activePartner.partnerId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-[#11241B] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-white/5'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-gray-400">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            m.isRead ? (
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

              {/* Input */}
              <div className="p-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 bg-white dark:bg-[#0D2118]">
                <input
                  type="text"
                  placeholder={`Reply to ${activePartner.partnerName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 text-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  disabled={!inputText.trim() || sending}
                  onClick={handleSend}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
              <p className="font-bold text-xs text-gray-700 dark:text-gray-300">Select an inquiry</p>
              <p className="text-[11px] text-gray-400 max-w-xs">
                Select a conversation from the left to read buyer messages and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
