'use client';

import React, { useState } from 'react';
import { PlatformGrowthPoint } from '@/lib/superadminApi';

interface PlatformGrowthChartProps {
  data?: PlatformGrowthPoint[];
}

export function PlatformGrowthChart({ data = [] }: PlatformGrowthChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points: PlatformGrowthPoint[] =
    data && data.length === 4
      ? data
      : [
          { label: 'Week 1', users: 12, orders: 8, startDate: '', endDate: '' },
          { label: 'Week 2', users: 22, orders: 17, startDate: '', endDate: '' },
          { label: 'Week 3', users: 31, orders: 27, startDate: '', endDate: '' },
          { label: 'Week 4', users: 43, orders: 36, startDate: '', endDate: '' },
        ];

  const svgWidth = 600;
  const svgHeight = 260;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(
    50,
    ...points.map((p) => Math.max(p.users, p.orders))
  );

  const getX = (index: number) => paddingLeft + (index / (points.length - 1)) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.min(val, maxVal) / maxVal) * chartH;

  const buildSmoothPath = (key: 'users' | 'orders') => {
    return points.reduce((acc, pt, i, arr) => {
      const x = getX(i);
      const y = getY(pt[key]);
      if (i === 0) return `M ${x} ${y}`;

      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][key]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + (x - prevX) / 2;
      const cpY2 = y;

      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
    }, '');
  };

  const usersPath = buildSmoothPath('users');
  const ordersPath = buildSmoothPath('orders');

  const usersArea = `${usersPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;
  const ordersArea = `${ordersPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      {/* Title & Legend */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
          Platform Growth
        </h3>

        {/* Legend matching screenshot */}
        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block ring-2 ring-[#10B981]/20" />
            <span>Users</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block ring-2 ring-[#38BDF8]/20" />
            <span>Orders</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="w-full relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  className="dark:stroke-[#163D2F]"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-gray-400 font-medium"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          <path d={ordersArea} fill="url(#ordersGradient)" />
          <path d={usersArea} fill="url(#usersGradient)" />

          {/* Lines */}
          <path d={ordersPath} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          <path d={usersPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Points & Hover interactions */}
          {points.map((pt, i) => {
            const x = getX(i);
            const yUsers = getY(pt.users);
            const yOrders = getY(pt.orders);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Orders dot */}
                <circle
                  cx={x}
                  cy={yOrders}
                  r={isHovered ? 5.5 : 4}
                  fill="#38BDF8"
                  className="transition-all duration-150 cursor-pointer stroke-2 stroke-white dark:stroke-[#0A2218]"
                />

                {/* Users dot */}
                <circle
                  cx={x}
                  cy={yUsers}
                  r={isHovered ? 5.5 : 4}
                  fill="#10B981"
                  className="transition-all duration-150 cursor-pointer stroke-2 stroke-white dark:stroke-[#0A2218]"
                />

                {/* Invisible hover trigger */}
                <rect
                  x={x - 20}
                  y={paddingTop}
                  width="40"
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* X-axis Label */}
                <text
                  x={x}
                  y={paddingTop + chartH + 22}
                  textAnchor="middle"
                  className={`text-[12px] font-semibold transition-colors ${
                    isHovered
                      ? 'fill-[#059669] dark:fill-emerald-400 font-bold'
                      : 'fill-gray-500 dark:fill-gray-400'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-3 z-20 -translate-x-1/2 bg-[#0A2218] text-white border border-emerald-800 text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none transition-all duration-150"
            style={{
              left: `${(getX(hoveredIdx) / svgWidth) * 100}%`,
            }}
          >
            <p className="font-bold text-emerald-300 text-[11px] mb-1">{points[hoveredIdx].label}</p>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-gray-300">Users:</span>
              <span className="font-bold text-emerald-400">{points[hoveredIdx].users.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-gray-300">Orders:</span>
              <span className="font-bold text-sky-400">{points[hoveredIdx].orders.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

