'use client';

import React, { useState } from 'react';

interface ChartPoint {
  day: string;
  date: string;
  local: number;
  intercity: number;
}

interface OrderOverviewChartProps {
  data?: ChartPoint[];
}

export function OrderOverviewChart({ data = [] }: OrderOverviewChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fallback points if empty
  const points: ChartPoint[] =
    data.length === 7
      ? data
      : [
          { day: 'Mon', date: '2026-10-19', local: 160, intercity: 110 },
          { day: 'Tue', date: '2026-10-20', local: 260, intercity: 180 },
          { day: 'Wed', date: '2026-10-21', local: 220, intercity: 150 },
          { day: 'Thu', date: '2026-10-22', local: 320, intercity: 230 },
          { day: 'Fri', date: '2026-10-23', local: 280, intercity: 220 },
          { day: 'Sat', date: '2026-10-24', local: 360, intercity: 280 },
          { day: 'Sun', date: '2026-10-25', local: 400, intercity: 310 },
        ];

  const svgWidth = 600;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxVal = 400;

  // Compute coordinate points
  const getX = (index: number) => paddingLeft + (index / (points.length - 1)) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.min(val, maxVal) / maxVal) * chartH;

  // Build SVG smooth path strings
  const buildSmoothPath = (valKey: 'local' | 'intercity') => {
    return points.reduce((acc, pt, i, arr) => {
      const x = getX(i);
      const y = getY(pt[valKey]);
      if (i === 0) return `M ${x} ${y}`;

      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][valKey]);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + (x - prevX) / 2;
      const cpY2 = y;

      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
    }, '');
  };

  const localPath = buildSmoothPath('local');
  const intercityPath = buildSmoothPath('intercity');

  const localArea = `${localPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;
  const intercityArea = `${intercityPath} L ${getX(points.length - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z`;

  const yTicks = [0, 100, 200, 300, 400];

  return (
    <div className="bg-white dark:bg-[#0A2218] border border-[#E3EAE5] dark:border-[#163D2F] rounded-2xl p-6 shadow-sm">
      {/* Header with Title and Legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#142E24] dark:text-[#E6F0EB] font-display">
            Order Overview
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block ring-2 ring-[#10B981]/20" />
            <span>Local</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block ring-2 ring-[#3B82F6]/20" />
            <span>Intercity</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="localGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="intercityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
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
                  className="stroke-gray-100 dark:stroke-[#153427]"
                />
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94A3B8"
                  className="font-medium"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={localArea} fill="url(#localGrad)" />
          <path d={intercityArea} fill="url(#intercityGrad)" />

          {/* Smooth Lines */}
          <path
            d={localPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={intercityPath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* X Axis Points & Labels */}
          {points.map((pt, i) => {
            const x = getX(i);
            const isHovered = hoveredIdx === i;

            return (
              <g key={pt.day} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                <text
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748B"
                  className="font-semibold"
                >
                  {pt.day}
                </text>

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point nodes */}
                <circle
                  cx={x}
                  cy={getY(pt.local)}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                />
                <circle
                  cx={x}
                  cy={getY(pt.intercity)}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-3 bg-gray-900/90 text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-lg pointer-events-none transition-all duration-150 backdrop-blur-sm z-10"
            style={{
              left: `${(getX(hoveredIdx) / svgWidth) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold border-b border-gray-700 pb-0.5 mb-1 text-center">
              {points[hoveredIdx].day} ({points[hoveredIdx].date})
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Local: {points[hoveredIdx].local} orders</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span>Intercity: {points[hoveredIdx].intercity} orders</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
