'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Search,
  CheckCheck,
  Menu,
} from 'lucide-react';

export default function FarmerMessagesPage({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const [conversations] = useState([
    {
      id: 'c-1',
      name: 'Addis Ababa Fresh Market (Aman)',
      role: 'Wholesale Buyer',
      lastMessage: 'Can you reserve 50 kg tomatoes for Thursday morning pickup?',
      time: '11:20 AM',
      unread: 1,
    },
    {
      id: 'c-2',
      name: 'Abebe Mekonnen',
      role: 'Delivery Courier',
      lastMessage: 'Arriving at your Sebeta farm gate in 15 minutes with the Isuzu truck.',
      time: '10:45 AM',
      unread: 0,
    },
    {
      id: 'c-3',
      name: 'Abyssinia Coffee Roasters',
      role: 'Commercial Buyer',
      lastMessage: 'Payment of ETB 4,200 cleared. Thank you for the quick dispatch.',
      time: 'Yesterday',
      unread: 0,
    },
  ]);

  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'them', text: 'Hello Ato Tesfaye, we saw your organic tomatoes listed.', time: '11:15 AM' },
    { sender: 'me', text: 'Hello Aman, yes, fresh harvest started today at 6 AM.', time: '11:18 AM' },
    { sender: 'them', text: 'Can you reserve 50 kg tomatoes for Thursday morning pickup?', time: '11:20 AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'me', text: inputText.trim(), time: 'Just now' },
    ]);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F5] dark:bg-[#0B1512]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
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
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col md:flex-row gap-4">
        {/* Left: Chat list */}
        <div className="w-full md:w-80 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xs">
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChat(c)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                  activeChat.id === c.id
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-gray-800 dark:text-white truncate">
                    {c.name}
                  </div>
                  <span className="text-[10px] text-gray-400">{c.time}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {c.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Active Chat Window */}
        <div className="flex-1 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shadow-xs">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-sm text-gray-800 dark:text-white">
                {activeChat.name}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {activeChat.role}
              </div>
            </div>
            <button className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 text-gray-600">
              <Phone className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-xs ${
                    m.sender === 'me'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message to buyer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
