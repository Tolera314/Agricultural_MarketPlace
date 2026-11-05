'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CornerDownRight,
  Menu,
  Loader2,
  Send,
} from 'lucide-react';
import { farmerApi } from '@/lib/farmerApi';

interface ReviewItem {
  id: string;
  buyer: string;
  product: string;
  rating: number;
  date: string;
  comment: string;
  reply: string | null;
}

export default function ReviewsPage(props: any) {
  const onOpenSidebar = props?.onOpenSidebar;
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInput, setReplyInput] = useState<{ [key: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await farmerApi.getReviews();
        if (res.success && Array.isArray(res.reviews)) {
          setReviews(res.reviews);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleReply = async (id: string) => {
    const text = replyInput[id]?.trim();
    if (!text) return;
    try {
      setSubmittingId(id);
      const res = await farmerApi.replyReview(id, text);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, reply: text } : r))
        );
        setReplyInput((prev) => ({ ...prev, [id]: '' }));
      }
    } catch (err) {
      console.error('Failed to reply to review:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

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
          <span>{avgRating} / 5.0 ({reviews.length} reviews)</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Loading buyer feedback...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">No reviews yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              When buyers receive and complete their produce orders, their ratings and honest reviews will be shown here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-gray-800 dark:text-white">
                      {rev.buyer}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {rev.product} · {rev.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{rev.rating.toFixed(1)}</span>
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
                      onChange={(e) =>
                        setReplyInput({ ...replyInput, [rev.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleReply(rev.id)}
                      disabled={submittingId === rev.id || !replyInput[rev.id]?.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {submittingId === rev.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Reply</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
