'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  ListChecks,
  Eye,
  MapPin,
  Lightbulb,
  Menu,
  BarChart2,
  ChevronRight,
  X,
  Tag,
  Wheat,
  User2,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Global search data — products, orders, buyers, categories
// ────────────────────────────────────────────────────────────
const SEARCH_DATA = [
  { type: 'product', label: 'Tomatoes',    sub: 'Vegetables · ETB 40/kg · 30 kg available', image: '/images/prod_tomatoes.jpg' },
  { type: 'product', label: 'Onions',      sub: 'Vegetables · ETB 25/kg · 50 kg available', image: '/images/cat_vegetables.jpg' },
  { type: 'product', label: 'Potatoes',    sub: 'Vegetables · ETB 18/kg · 80 kg available', image: '/images/prod_maize.jpg' },
  { type: 'product', label: 'Green Beans', sub: 'Vegetables · ETB 35/kg · 20 kg available', image: '/images/prod_lettuce.jpg' },
  { type: 'product', label: 'Maize',       sub: 'Grains · ETB 12/kg · 200 kg available',    image: '/images/prod_maize.jpg' },
  { type: 'product', label: 'Coffee',      sub: 'Coffee & Spices · ETB 280/kg · 15 kg available', image: '/images/prod_coffee.jpg' },
  { type: 'product', label: 'Oranges',     sub: 'Fruits · ETB 22/kg · 60 kg available',     image: '/images/prod_orange.jpg' },
  { type: 'product', label: 'Lettuce',     sub: 'Vegetables · ETB 15/kg · 40 kg available', image: '/images/prod_lettuce.jpg' },
  { type: 'order',   label: 'Order #1 — Tomatoes',    sub: 'Buyer: Addis Abeba · ETB 1,200 · Processing', image: '/images/prod_tomatoes.jpg' },
  { type: 'order',   label: 'Order #2 — Onions',      sub: 'Buyer: Bole · ETB 900 · Shipped',             image: '/images/cat_vegetables.jpg' },
  { type: 'order',   label: 'Order #3 — Potatoes',    sub: 'Buyer: Lideta · ETB 2,500 · Delivered',       image: '/images/prod_maize.jpg' },
  { type: 'order',   label: 'Order #4 — Green Beans', sub: 'Buyer: Bole · ETB 850 · Pending',             image: '/images/prod_lettuce.jpg' },
  { type: 'buyer',   label: 'Addis Abeba Market',  sub: 'Buyer · 3 orders',  image: '' },
  { type: 'buyer',   label: 'Bole Fresh Market',   sub: 'Buyer · 2 orders',  image: '' },
  { type: 'buyer',   label: 'Lideta Wholesale',    sub: 'Buyer · 1 order',   image: '' },
  { type: 'category', label: 'Vegetables', sub: 'Category · 5 products', image: '/images/cat_vegetables.jpg' },
  { type: 'category', label: 'Grains',     sub: 'Category · 2 products', image: '/images/cat_grains.jpg' },
  { type: 'category', label: 'Fruits',     sub: 'Category · 1 product',  image: '/images/cat_fruits.jpg' },
  { type: 'category', label: 'Coffee & Spices', sub: 'Category · 1 product', image: '/images/cat_coffee_spices.jpg' },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  product:  <Package  className="w-3.5 h-3.5" />,
  order:    <ShoppingCart className="w-3.5 h-3.5" />,
  buyer:    <User2    className="w-3.5 h-3.5" />,
  category: <Tag      className="w-3.5 h-3.5" />,
};

const TYPE_COLOR: Record<string, string> = {
  product:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  order:    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  buyer:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  category: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

// ────────────────────────────────────────────────────────────
// GlobalSearch component
// ────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 1
    ? SEARCH_DATA.filter((d) =>
        d.label.toLowerCase().includes(query.toLowerCase()) ||
        d.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Search input */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all bg-white dark:bg-white/5 ${
        open
          ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-gray-200 dark:border-white/10 shadow-sm hover:border-gray-300 dark:hover:border-white/20'
      }`}>
        <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, orders, buyers, categories..."
          className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="shrink-0 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown results */}
      {open && query.trim().length >= 1 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Wheat className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400 dark:text-gray-600">Try searching by product name, buyer, or category</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </span>
              </div>
              <ul className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.04]">
                {results.map((item, i) => (
                  <li key={i}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
                      onClick={() => { setQuery(item.label); setOpen(false); }}
                    >
                      {/* Thumbnail */}
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-100 dark:border-white/5 flex items-center justify-center">
                        {item.image ? (
                          <Image src={item.image} alt={item.label} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <User2 className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{item.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.sub}</p>
                      </div>

                      {/* Type badge */}
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLOR[item.type]}`}>
                        {TYPE_ICON[item.type]}
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const STATS = [
  {
    id: 'products',
    label: 'Total Products',
    value: '8',
    change: '+2 new',
    trend: 'up' as const,
    icon: <Package className="w-5 h-5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/25',
    border: 'border-emerald-100 dark:border-emerald-800/30',
    iconBg: 'bg-white dark:bg-emerald-900/40',
  },
  {
    id: 'orders',
    label: 'Total Orders',
    value: '24',
    change: '+5 this week',
    trend: 'up' as const,
    icon: <ShoppingCart className="w-5 h-5" />,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/25',
    border: 'border-sky-100 dark:border-sky-800/30',
    iconBg: 'bg-white dark:bg-sky-900/40',
  },
  {
    id: 'earnings',
    label: 'Total Earnings',
    value: 'ETB 12,450',
    change: '+12%',
    trend: 'up' as const,
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/25',
    border: 'border-amber-100 dark:border-amber-800/30',
    iconBg: 'bg-white dark:bg-amber-900/40',
  },
  {
    id: 'products',
    label: 'Active Listings',
    value: '6',
    change: 'out of 8',
    trend: 'neutral' as const,
    icon: <ListChecks className="w-5 h-5" />,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/25',
    border: 'border-violet-100 dark:border-violet-800/30',
    iconBg: 'bg-white dark:bg-violet-900/40',
  },
];

const ORDERS = [
  {
    id: 'ord-1',
    product: 'Tomatoes',
    image: '/images/prod_tomatoes.jpg',
    buyer: 'Addis Abeba',
    qty: '15 kg',
    amount: 'ETB 1,200',
    status: 'Processing',
    statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    id: 'ord-2',
    product: 'Onions',
    image: '/images/cat_vegetables.jpg',
    buyer: 'Bole',
    qty: '15 kg',
    amount: 'ETB 900',
    status: 'Shipped',
    statusColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    id: 'ord-3',
    product: 'Potatoes',
    image: '/images/prod_maize.jpg',
    buyer: 'Lideta',
    qty: '50 kg',
    amount: 'ETB 2,500',
    status: 'Delivered',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    id: 'ord-4',
    product: 'Green Beans',
    image: '/images/prod_lettuce.jpg',
    buyer: 'Bole',
    qty: '10 kg',
    amount: 'ETB 850',
    status: 'Pending',
    statusColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
];

// Sales Overview bar chart data
const CHART_DATA: Record<string, { label: string; value: number }[]> = {
  week: [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 2800 },
    { label: 'Wed', value: 1900 },
    { label: 'Thu', value: 3400 },
    { label: 'Fri', value: 2200 },
    { label: 'Sat', value: 4500 },
    { label: 'Sun', value: 3100 },
  ],
  month: [
    { label: 'W1',  value: 8200  },
    { label: 'W2',  value: 11400 },
    { label: 'W3',  value: 9800  },
    { label: 'W4',  value: 13200 },
  ],
  year: [
    { label: 'Jan', value: 22000 },
    { label: 'Feb', value: 18500 },
    { label: 'Mar', value: 31000 },
    { label: 'Apr', value: 27500 },
    { label: 'May', value: 35000 },
    { label: 'Jun', value: 29000 },
    { label: 'Jul', value: 41000 },
    { label: 'Aug', value: 38000 },
    { label: 'Sep', value: 33000 },
    { label: 'Oct', value: 44500 },
    { label: 'Nov', value: 39000 },
    { label: 'Dec', value: 51000 },
  ],
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  color,
  bg,
  border,
  iconBg,
}: (typeof STATS)[0]) {
  return (
    <div
      className={`rounded-2xl border ${border} ${bg} px-4 py-4 flex flex-col gap-2.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
          {label}
        </span>
        <span className={`p-2 rounded-xl ${iconBg} ${color} shadow-xs border border-white/50 dark:border-white/5`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[22px] font-extrabold text-gray-800 dark:text-white leading-none tracking-tight">
          {value}
        </p>
        <p
          className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {change}
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SalesBarChart — fully functional interactive bar chart
// ────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'year';

const PERIODS: { key: Period; label: string; growth: number; prevLabel: string }[] = [
  { key: 'week',  label: 'This Week',  growth: 12.4, prevLabel: 'last week'  },
  { key: 'month', label: 'This Month', growth:  8.7, prevLabel: 'last month' },
  { key: 'year',  label: 'This Year',  growth: 23.1, prevLabel: 'last year'  },
];

const BAR_COLORS = [
  { base: '#10B981', hover: '#059669' },
  { base: '#3B82F6', hover: '#2563EB' },
  { base: '#F59E0B', hover: '#D97706' },
  { base: '#8B5CF6', hover: '#7C3AED' },
  { base: '#EF4444', hover: '#DC2626' },
  { base: '#06B6D4', hover: '#0891B2' },
  { base: '#F97316', hover: '#EA580C' },
  { base: '#84CC16', hover: '#65A30D' },
  { base: '#EC4899', hover: '#DB2777' },
  { base: '#14B8A6', hover: '#0D9488' },
  { base: '#6366F1', hover: '#4F46E5' },
  { base: '#F43F5E', hover: '#E11D48' },
];

function SalesBarChart() {
  const [period, setPeriod] = useState<Period>('week');
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const [animKey, setAnimKey] = useState(0); // triggers re-mount animation
  const containerRef = useRef<HTMLDivElement>(null);

  const data = CHART_DATA[period];
  const maxVal = Math.max(...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const meta = PERIODS.find((p) => p.key === period)!;

  // Current bar = today (week), current week (month), current month (year)
  const NOW_INDEX: Record<Period, number> = {
    week:  new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // Mon=0
    month: Math.min(Math.ceil(new Date().getDate() / 7) - 1, 3),
    year:  new Date().getMonth(),
  };
  const activeIndex = Math.min(NOW_INDEX[period], data.length - 1);

  const formatETB = (v: number) =>
    v >= 1_000_000
      ? `ETB ${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
      ? `ETB ${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
      : `ETB ${v}`;

  // Nice Y-axis: 4 steps from 0 → rounded max
  const niceMax = Math.ceil(maxVal / (maxVal > 10000 ? 10000 : maxVal > 1000 ? 1000 : 100)) *
    (maxVal > 10000 ? 10000 : maxVal > 1000 ? 1000 : 100);
  const ySteps = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];

  const handlePeriodChange = (val: Period) => {
    setPeriod(val);
    setTooltip(null);
    setAnimKey((k) => k + 1); // re-trigger bar grow animation
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Total Revenue
          </p>
          <p className="text-xl font-extrabold text-[#1B4332] dark:text-emerald-400 leading-tight">
            {formatETB(total)}
          </p>
        </div>

        {/* Period dropdown */}
        <div className="relative -mt-1">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-[11px] font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D2118] text-[#1B4332] dark:text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-sm"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="flex gap-2 items-end" ref={containerRef}>
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between text-[9px] text-gray-300 dark:text-gray-600 shrink-0 pb-5"
          style={{ height: 150 }}
        >
          {ySteps.map((v, i) => (
            <span key={i}>
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </span>
          ))}
        </div>

        {/* Bars area */}
        <div className="flex-1 relative" key={animKey}>
          <div
            className="flex items-end gap-1.5"
            style={{ height: 150 }}
            onMouseLeave={() => setTooltip(null)}
          >
            {data.map((d, i) => {
              const heightPct = niceMax > 0 ? Math.max(3, Math.round((d.value / niceMax) * 100)) : 3;
              const isActive  = i === activeIndex;
              const isHovered = tooltip?.index === i;
              const color     = BAR_COLORS[i % BAR_COLORS.length];

              return (
                <div
                  key={`${period}-${d.label}`}
                  className="flex flex-col items-center gap-1 flex-1 cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const cRect = containerRef.current?.getBoundingClientRect();
                    if (cRect) {
                      setTooltip({
                        index: i,
                        x: rect.left - cRect.left + rect.width / 2,
                        y: rect.top  - cRect.top  - 8,
                      });
                    }
                  }}
                >
                  {/* Bar */}
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${heightPct}%`,
                      background:
                        isActive || isHovered
                          ? `linear-gradient(to top, ${color.hover}, ${color.base})`
                          : `linear-gradient(to top, ${color.base}88, ${color.base}44)`,
                      boxShadow:
                        isActive || isHovered
                          ? `0 4px 14px ${color.base}50`
                          : 'none',
                      transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      transition: 'height 0.45s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, box-shadow 0.2s, transform 0.15s',
                      animation: `growBar 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms both`,
                    }}
                  />

                  {/* Day label */}
                  <span
                    className="text-[9px] transition-colors"
                    style={{
                      color:      isActive ? color.base : '#9CA3AF',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip !== null && data[tooltip.index] && (() => {
            const color = BAR_COLORS[tooltip.index % BAR_COLORS.length];
            return (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div
                  className="text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center gap-0.5"
                  style={{ background: color.hover }}
                >
                  <span className="text-[9px] opacity-75">{data[tooltip.index].label}</span>
                  <span>{formatETB(data[tooltip.index].value)}</span>
                </div>
                <div className="flex justify-center">
                  <div
                    className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
                    style={{ borderTopColor: color.hover }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Footer: growth stat ── */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          +{meta.growth}% vs {meta.prevLabel}
        </span>
      </div>

      {/* Keyframe for bar grow animation */}
      <style>{`
        @keyframes growBar {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

interface FarmerDashboardContentProps {
  activePage: string;
  onOpenSidebar: () => void;
  onNavigate: (page: string) => void;
}

export default function FarmerDashboardContent({
  activePage,
  onOpenSidebar,
  onNavigate,
}: FarmerDashboardContentProps) {
  const [searchQuery] = useState('');
  void searchQuery; // reserved for future server-side search

  if (activePage !== 'dashboard') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar even for placeholder pages */}
        <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-14 flex items-center gap-4 shadow-sm">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 transition-all"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 dark:text-gray-400">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-400 overflow-hidden">
                <Image src="/images/avatar_abebe_hd.jpg" alt="Tesfaye Abebe" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-200">Tesfaye Abebe</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
          <div className="text-center space-y-3 p-8">
            <BarChart2 className="w-14 h-14 mx-auto opacity-20" />
            <p className="text-base font-semibold capitalize text-gray-500 dark:text-gray-400">{activePage.replace('-', ' ')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-600">This section is coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Top Navbar ─────────────────────────────────────── */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 h-16 flex items-center gap-4 shadow-sm">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Centered global search — takes remaining space */}
        <div className="flex-1 flex justify-center">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notification bell */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 dark:text-gray-400" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User avatar + name */}
          <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-400 overflow-hidden shrink-0">
              <Image
                src="/images/avatar_abebe_hd.jpg"
                alt="Tesfaye Abebe"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">Tesfaye Abebe</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">Farmer</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* ── Scrollable Body ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Background farm image — fixed, low opacity */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Image
            src="/images/farm_bg.jpg"
            alt=""
            fill
            className="object-cover object-top opacity-[0.06] dark:opacity-[0.04]"
            priority
          />
        </div>
        <div className="relative z-10 bg-[#F4F6F5]/90 dark:bg-[#0B1512]/90 min-h-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-4">

          {/* ── Welcome Banner ─────────────────────────────── */}
          <div className="relative rounded-2xl overflow-hidden bg-[#E3F2E9] dark:bg-[#122A1E] border border-[#C8E6D0] dark:border-[#1E4130] shadow-sm flex items-center min-h-[140px] sm:min-h-[150px]">

            {/* Farm photo at the right — neat, full clarity, no haze */}
            <div className="absolute inset-y-0 right-0 w-full md:w-3/5 lg:w-1/2 overflow-hidden pointer-events-none">
              <Image
                src="/images/farm_bg.jpg"
                alt="Farm landscape background"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-right"
              />
              {/* Left transition keeping mint background opacity as it is, fading cleanly so the right part is 100% neat */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#E3F2E9] via-[#E3F2E9]/60 to-transparent dark:from-[#122A1E] dark:via-[#122A1E]/60 dark:to-transparent" />
            </div>

            {/* Text on the left — high contrast, opacity as it is */}
            <div className="relative z-10 max-w-xl px-6 sm:px-10 py-6">
              <h1 className="flex items-center gap-2 text-[24px] sm:text-[28px] font-extrabold text-[#1B4332] dark:text-white leading-tight tracking-tight">
                Welcome, Tesfaye!
                <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
                  <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
                  <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
                  <path d="M18 25V30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[#4A7C5E] dark:text-emerald-300 font-medium mt-1">
                Your farm. Your products. Your future.
              </p>
            </div>
          </div>

          {/* ── Stats Grid ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((stat) => (
              <button
                key={stat.id + stat.label}
                onClick={() => onNavigate(stat.id)}
                className="text-left w-full cursor-pointer group"
              >
                <StatCard {...stat} />
              </button>
            ))}
          </div>

          {/* ── Main Content: Orders + Right Panel ─────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Recent Orders */}
            <div className="xl:col-span-2 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
                <h2 className="font-bold text-gray-800 dark:text-white text-sm">Recent Orders</h2>
                <button
                  onClick={() => onNavigate('orders')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View All
                </button>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] px-5 py-2.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/60 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                <span>Product</span>
                <span>Buyer</span>
                <span>Quantity</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {ORDERS.map((order) => (
                  <div
                    key={order.id}
                    className="sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] flex flex-wrap gap-2 items-center px-5 py-3 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Product + image */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-100 dark:border-white/5">
                        <Image
                          src={order.image}
                          alt={order.product}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{order.product}</p>
                    </div>

                    {/* Buyer */}
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{order.buyer}</span>

                    {/* Quantity */}
                    <span className="text-xs text-gray-600 dark:text-gray-400">{order.qty}</span>

                    {/* Amount */}
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{order.amount}</span>

                    {/* Status badge */}
                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.statusColor} whitespace-nowrap`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right Panel ─────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Your Products card */}
              <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <h2 className="font-bold text-gray-800 dark:text-white text-sm">Your Products</h2>
                  <button
                    onClick={() => onNavigate('products')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View All
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {/* Featured product */}
                  <div className="flex gap-3 items-start">
                    <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-100 dark:border-white/5">
                      <Image
                        src="/images/prod_tomatoes.jpg"
                        alt="Tomatoes"
                        width={68}
                        height={68}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-bold text-sm text-gray-800 dark:text-white">Tomatoes</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ETB 40 / kg
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Fresh · Grade A · 30 kg available
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('products')}
                    className="w-full py-2 rounded-xl bg-[#173F35] hover:bg-[#1e5c47] active:bg-[#122e26] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Manage
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sales Overview */}
              <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-4 flex-1">
                <h2 className="font-bold text-gray-800 dark:text-white text-sm mb-3">Sales Overview</h2>
                <SalesBarChart />
              </div>
            </div>
          </div>

          {/* ── Bottom Info Strip ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Local Market */}
            <div className="bg-[#EDF7F1] dark:bg-[#0D2118] rounded-2xl border border-emerald-100 dark:border-white/5 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-white">Local Market</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  You are in Addis Ababa (Bole)
                </p>
              </div>
              <button className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/30">
                Change
              </button>
            </div>

            {/* Tip */}
            <div className="bg-[#EDF7F1] dark:bg-[#0D2118] rounded-2xl border border-emerald-100 dark:border-white/5 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-white">Tip</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Keep your stock updated to get more orders from nearby buyers.
                </p>
              </div>
            </div>
          </div>

          <div className="h-3" />
        </div>
        </div>
      </div>
    </div>
  );
}
