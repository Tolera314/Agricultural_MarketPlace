'use client';

import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  CornerDownRight,
  Menu,
} from 'lucide-react';

export default function (props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      buyer: 'Addis Ababa Fresh Market',
      product: 'Organic Tomatoes (30 kg)',
      rating: 5,
      date: '2 days ago',
      comment: 'Top grade freshness! Our restaurant clients were extremely satisfied with the firm skin and natural taste.',
      reply: 'Thank you! We pick our tomatoes at first light to preserve moisture.',
    },
    {
      id: 'rev-2',
      buyer: 'Lideta Food Hub',
      product: 'Red Onions (50 kg)',
      rating: 5,
      date: '5 days ago',
      comment: 'Very clean bags and accurate weight. Delivered right on schedule by courier Abebe.',
      reply: null,
    },
    {
      id: 'rev-3',
      buyer: 'Abyssinia Roasters',
      product: 'Arabica Sidama Coffee (15 kg)',
      rating: 4.8,
      date: 'Oct 18, 2026',
      comment: 'Aromatic beans, uniform drying. Looking forward to our next recurring bulk order.',
      reply: 'Appreciate your business! The new November harvest is already curing.',
    },
  ]);

  const [replyInput, setReplyInput] = useState<{ [key: string]: string }>({});

  const handleReply = (id: string) => {
    const text = replyInput[id];
    if (!text) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: text } : r));
    setReplyInput(prev => ({ ...prev, [id]: '' }));
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
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Customer Reviews & Feedback
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Verified feedback from wholesale and retail produce buyers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>4.9 / 5.0 (42 reviews)</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl">
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-gray-800 dark:text-white">{rev.buyer}</div>
                  <div className="text-[11px] text-gray-400">{rev.product} · {rev.date}</div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{rev.rating}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                &ldquo;{rev.comment}&rdquo;
              </p>

              {rev.reply ? (
                <div className="ml-4 pl-3 border-l-2 border-emerald-500 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Your Response:</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{rev.reply}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write a polite reply to buyer..."
                    value={replyInput[rev.id] || ''}
                    onChange={(e) => setReplyInput({ ...replyInput, [rev.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                  />
                  <button
                    onClick={() => handleReply(rev.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
