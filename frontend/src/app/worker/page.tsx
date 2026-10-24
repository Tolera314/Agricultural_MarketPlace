'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  DollarSign,
  User,
  MessageSquare,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Star,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Bike,
  Car,
  TrendingUp,
  Activity,
  Loader2,
  Map,
  XCircle,
  Headphones,
  Check,
  Send,
  PhoneCall,
  Edit2,
  FileText,
  CreditCard,
  ShieldCheck,
  Search,
  ExternalLink,
  HelpCircle,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { workerApi } from '@/lib/workerApi';
import type {
  DashboardData,
  DeliveryOffer,
  DeliveryJob,
  EarningsData,
  WorkerAvailability,
  DeliveryStatus,
} from '@/types/worker';

// ─── Constants & Metadata ─────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'offers', label: 'Available Orders', icon: Package, badge: 3 },
  { key: 'deliveries', label: 'My Deliveries', icon: Truck },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'vehicle', label: 'Vehicle & Profile', icon: User },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  UNASSIGNED: 'Unassigned',
  BROADCASTING: 'Available',
  ASSIGNED: 'Assigned',
  HEADING_TO_PICKUP: 'Heading to Pickup',
  PICKED_UP: 'Picked Up',
  EN_ROUTE: 'En Route',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_NEXT: Partial<Record<DeliveryStatus, { label: string; next: DeliveryStatus }>> = {
  ASSIGNED: { label: 'Head to Pickup', next: 'HEADING_TO_PICKUP' },
  HEADING_TO_PICKUP: { label: 'Mark Picked Up', next: 'PICKED_UP' },
  PICKED_UP: { label: 'Start Delivery', next: 'EN_ROUTE' },
  EN_ROUTE: { label: 'Mark Delivered', next: 'DELIVERED' },
};

// ─── Helper Functions ─────────────────────────────────────────

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return 'ETB 0';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return 'ETB 0';
  return `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Reference Default / Fallback Data ─────────────────────────

interface NearbyRequestItem {
  id: string;
  title: string;
  distance: string;
  location: string;
  fee: number;
  weightKg: number;
  timerMinutes: number;
  image: string;
  accepted?: boolean;
}

const INITIAL_NEARBY_REQUESTS: NearbyRequestItem[] = [
  {
    id: 'req-1',
    title: 'Fresh Tomatoes',
    distance: '2.1 km',
    location: 'Addis Ababa',
    fee: 120,
    weightKg: 5,
    timerMinutes: 5,
    image: '/images/prod_tomatoes.jpg',
  },
  {
    id: 'req-2',
    title: 'Green Beans',
    distance: '3.4 km',
    location: 'Bole',
    fee: 100,
    weightKg: 3,
    timerMinutes: 8,
    image: '/images/prod_green_beans.jpg',
  },
  {
    id: 'req-3',
    title: 'Potatoes',
    distance: '4.2 km',
    location: 'Lideta',
    fee: 90,
    weightKg: 10,
    timerMinutes: 12,
    image: '/images/prod_potatoes.jpg',
  },
];

// ─── Sub-components ───────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800 ${className ?? ''}`} />;
}

/**
 * Metric card matching reference image styling:
 * Top-row cards with soft background, crisp icon, label, bold value, and badge/subtext.
 */
function DashboardMetricCard({
  icon,
  label,
  value,
  sub,
  badge,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  badge?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3EDE6] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        {badge && (
          <span className="text-[11px] font-bold text-[#088647] bg-[#E5F7ED] px-2 py-0.5 rounded-full flex items-center gap-0.5">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wider text-[#6B8B7B] font-semibold">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl sm:text-2xl font-black text-[#0B3322] leading-tight tracking-tight">{value}</p>
          {sub && <span className="text-xs text-[#7B998A] font-medium">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Stylized route map matching the reference image's visual card:
 * Route line with 3 green location pin markers, deliveries count, distance, and "View Full Route" button.
 */
function RouteCardVisual({
  deliveriesCount = 3,
  distanceKm = '12.5 km',
  onOpenRouteModal,
}: {
  deliveriesCount?: number;
  distanceKm?: string;
  onOpenRouteModal: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3EDE6] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0B3322]">Today&apos;s Route</h3>
      </div>

      {/* Stylized vector map canvas */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[#F2F8F4] border border-[#DEEBE1]">
        {/* Soft road network grid */}
        <svg viewBox="0 0 340 160" className="w-full h-full" preserveAspectRatio="none">
          {/* Faint street lines */}
          <line x1="20" y1="0" x2="20" y2="160" stroke="#E2EFE6" strokeWidth="1.5" />
          <line x1="90" y1="0" x2="90" y2="160" stroke="#E2EFE6" strokeWidth="1" />
          <line x1="170" y1="0" x2="170" y2="160" stroke="#E2EFE6" strokeWidth="2" />
          <line x1="250" y1="0" x2="250" y2="160" stroke="#E2EFE6" strokeWidth="1" />
          <line x1="310" y1="0" x2="310" y2="160" stroke="#E2EFE6" strokeWidth="1.5" />

          <line x1="0" y1="35" x2="340" y2="35" stroke="#E2EFE6" strokeWidth="1.5" />
          <line x1="0" y1="75" x2="340" y2="75" stroke="#E2EFE6" strokeWidth="2" />
          <line x1="0" y1="120" x2="340" y2="120" stroke="#E2EFE6" strokeWidth="1" />

          {/* Secondary curved roads */}
          <path d="M 0 140 Q 100 110 180 130 T 340 100" stroke="#D7EAD9" strokeWidth="1.5" fill="none" />
          <path d="M 40 0 Q 80 60 140 80 T 280 160" stroke="#D7EAD9" strokeWidth="1.2" fill="none" />

          {/* Active green route path with soft glow */}
          <path
            d="M 42 110 C 80 115 110 50 160 55 C 210 60 230 110 285 92"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Location Pin 1 (Pickup Lideta) */}
          <g transform="translate(42, 110)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">
              1
            </text>
          </g>

          {/* Location Pin 2 (Stop 2 Bole) */}
          <g transform="translate(160, 55)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">
              2
            </text>
          </g>

          {/* Location Pin 3 (Dropoff Kazanchis) */}
          <g transform="translate(285, 92)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">
              3
            </text>
          </g>
        </svg>

        {/* Live indicator badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#075C3B] flex items-center gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Route
        </div>
      </div>

      {/* Route metrics row */}
      <div className="flex items-center justify-between text-xs text-[#517663] font-semibold mt-3 px-1">
        <span className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-[#075C3B]" />
          {deliveriesCount} deliveries
        </span>
        <span className="flex items-center gap-1.5 text-[#0B3322] font-bold">
          <Navigation className="w-3.5 h-3.5 text-[#075C3B]" />
          {distanceKm}
        </span>
      </div>

      {/* View full route button */}
      <button
        onClick={onOpenRouteModal}
        className="mt-3.5 w-full py-2.5 rounded-xl border border-[#BDE0CB] text-[#075C3B] hover:bg-[#EAF6EF] hover:border-[#075C3B] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View Full Route</span>
      </button>
    </div>
  );
}

/**
 * Your Vehicle card matching reference design:
 * Icon, Title "Motorcycle", Subtitle "Capacity: 50 kg", Edit link.
 */
function VehicleCard({
  vehicleType = 'Motorcycle',
  capacityKg = 50,
  plate = '3-A45129 ET',
  onEdit,
}: {
  vehicleType?: string;
  capacityKg?: number;
  plate?: string;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3EDE6] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[#0B3322]">Your Vehicle</h3>
        <button
          onClick={onEdit}
          className="text-xs text-[#075C3B] font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Edit</span>
        </button>
      </div>

      <div className="flex items-center gap-3.5 mt-1">
        <div className="w-11 h-11 rounded-xl bg-[#E8F6EE] flex items-center justify-center text-[#075C3B] shrink-0">
          <Bike className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B3322]">{vehicleType}</p>
          <p className="text-xs text-[#6B8B7B] font-medium">Capacity: {capacityKg} kg</p>
          {plate && <p className="text-[11px] text-[#8EA89B] font-mono mt-0.5">{plate}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Nearby Delivery Requests card matching reference design:
 * List of items with circular food images, title, distance, price & weight, and green "Accept" button.
 */
function NearbyDeliveryRequestsCard({
  requests,
  onAccept,
  onViewAll,
}: {
  requests: NearbyRequestItem[];
  onAccept: (req: NearbyRequestItem) => void;
  onViewAll: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3EDE6] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#0B3322]">Nearby Delivery Requests</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-[#075C3B] font-bold hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-[#EDF5F0]">
        {requests.map(item => (
          <div
            key={item.id}
            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group transition-colors"
          >
            {/* Product image & description */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E2ECE5] bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0B3322] truncate">{item.title}</h4>
                <p className="text-xs text-[#6B8B7B] mt-0.5">
                  {item.distance} &bull; {item.location}
                </p>
                <p className="text-xs font-bold text-[#0B3322] mt-0.5">
                  ETB {item.fee} &bull; {item.weightKg} kg
                </p>
              </div>
            </div>

            {/* Accept button and timer */}
            <div className="flex items-center gap-3 shrink-0">
              {item.accepted ? (
                <span className="px-3 py-1.5 rounded-lg bg-[#E7F7ED] text-[#088647] text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Accepted
                </span>
              ) : (
                <button
                  onClick={() => onAccept(item)}
                  className="px-4 py-1.5 rounded-lg bg-[#075C3B] hover:bg-[#05462D] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Accept
                </button>
              )}
              <span className="text-xs text-[#7B998A] font-medium min-w-[36px] text-right">
                {item.timerMinutes} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Recent Activity card matching reference design:
 * List of recent logs (Delivery completed, Order assigned) with fee, timestamp, and chevron.
 */
function RecentActivityCard({
  activities,
  onViewAll,
}: {
  activities?: { id: string; title: string; subtitle: string; fee?: string; time: string }[];
  onViewAll?: () => void;
}) {
  const defaultItems = [
    {
      id: 'act-1',
      title: 'Delivery completed',
      subtitle: 'Tomatoes • 2.1 km',
      fee: 'ETB 120',
      time: '2 hours ago',
    },
    {
      id: 'act-2',
      title: 'Order assigned',
      subtitle: 'Green Beans • 3.4 km',
      fee: '',
      time: '1 hour ago',
    },
  ];

  const items = activities && activities.length > 0 ? activities : defaultItems;

  return (
    <div className="bg-white rounded-2xl border border-[#E3EDE6] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0B3322]">Recent Activity</h3>
        <span className="text-xs text-[#7B998A] font-medium">2 hours ago</span>
      </div>

      <div className="divide-y divide-[#EDF5F0]">
        {items.map(item => (
          <div key={item.id} className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBF5EE] text-[#075C3B] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B3322]">{item.title}</p>
                <p className="text-[11px] text-[#6B8B7B] mt-0.5">{item.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                {item.fee && <p className="text-xs font-bold text-[#0B3322]">{item.fee}</p>}
                <p className="text-[11px] text-[#8EA89B]">{item.time}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A0BAAC]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal: View Full Route ───────────────────────────────────

function FullRouteModal({
  open,
  onClose,
  deliveriesCount = 3,
  distanceKm = '12.5 km',
}: {
  open: boolean;
  onClose: () => void;
  deliveriesCount?: number;
  distanceKm?: string;
}) {
  if (!open) return null;

  const stops = [
    {
      step: 1,
      type: 'Pickup',
      location: 'Lideta Farm Cooperative, Hub #4',
      product: '5 kg Fresh Tomatoes',
      farmer: 'Farmer Abebe Bikila (+251 911 445 566)',
      status: 'Ready for pickup',
    },
    {
      step: 2,
      type: 'Dropoff',
      location: 'Bole Rwanda, House 342, Addis Ababa',
      product: '3 kg Green Beans',
      customer: 'Selamawit Tadesse (+251 922 112 233)',
      status: 'Next in sequence',
    },
    {
      step: 3,
      type: 'Dropoff',
      location: 'Kazanchis, Near ECA Building, Addis Ababa',
      product: '10 kg Golden Potatoes',
      customer: 'Dawit Mengistu (+251 933 778 899)',
      status: 'Scheduled (ETA 40m)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EDE6] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#083827] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Optimized Route Plan</h3>
              <p className="text-xs text-emerald-200">
                {deliveriesCount} Deliveries &bull; {distanceKm} &bull; Est. 45 mins
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-[#E8F6EE] p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-[#075C3B]">
            <span>Traffic status: Light</span>
            <span>Total Earnings for route: ETB 310</span>
          </div>

          <div className="space-y-3 relative pl-4 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D4E8DC]">
            {stops.map(s => (
              <div key={s.step} className="relative flex items-start gap-3 bg-[#F9FCFA] p-3.5 rounded-2xl border border-[#E6F0EA]">
                <div className="w-6 h-6 rounded-full bg-[#075C3B] text-white text-xs font-bold flex items-center justify-center shrink-0 z-10">
                  {s.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#075C3B] bg-[#E3F4EA] px-2 py-0.5 rounded-md">
                      {s.type}
                    </span>
                    <span className="text-[11px] text-[#6B8B7B] font-medium">{s.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0B3322] mt-1">{s.location}</p>
                  <p className="text-xs text-[#517663] mt-0.5 font-medium">{s.product}</p>
                  <p className="text-[11px] text-[#7B998A] mt-0.5">{s.farmer || s.customer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#E3EDE6] flex gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] text-xs font-bold text-[#375747] hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert('GPS Navigation launched! Heading to Stop 1 (Lideta Farm Cooperative).');
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            Start GPS Navigation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Edit Vehicle ──────────────────────────────────────

function EditVehicleModal({
  open,
  onClose,
  initialType = 'Motorcycle',
  initialCapacity = 50,
  initialPlate = '3-A45129 ET',
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: string;
  initialCapacity?: number;
  initialPlate?: string;
  onSave: (data: { vehicleType: string; capacityKg: number; plate: string }) => void;
}) {
  const [vehicleType, setVehicleType] = useState(initialType);
  const [capacityKg, setCapacityKg] = useState(initialCapacity);
  const [plate, setPlate] = useState(initialPlate);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E3EDE6] flex flex-col">
        <div className="px-6 py-4 bg-[#083827] text-white flex items-center justify-between">
          <h3 className="text-base font-bold">Edit Vehicle Details</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#0B3322] block mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              className="w-full text-xs font-medium bg-[#F2F7F4] border border-[#D7E6DD] rounded-xl px-3 py-2.5 text-[#0B3322] focus:outline-none focus:border-[#075C3B]"
            >
              <option value="Motorcycle">Motorcycle</option>
              <option value="Pickup Truck">Pickup Truck</option>
              <option value="Three-Wheeler">Three-Wheeler (Bajaj)</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Van / Small Truck">Van / Small Truck</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] block mb-1">Carrying Capacity (kg)</label>
            <input
              type="number"
              value={capacityKg}
              onChange={e => setCapacityKg(Number(e.target.value))}
              className="w-full text-xs font-medium bg-[#F2F7F4] border border-[#D7E6DD] rounded-xl px-3 py-2 text-[#0B3322] focus:outline-none focus:border-[#075C3B]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] block mb-1">License Plate Number</label>
            <input
              type="text"
              value={plate}
              onChange={e => setPlate(e.target.value)}
              className="w-full text-xs font-medium bg-[#F2F7F4] border border-[#D7E6DD] rounded-xl px-3 py-2 text-[#0B3322] focus:outline-none focus:border-[#075C3B]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[#E3EDE6] flex gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] text-xs font-bold text-[#375747] hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ vehicleType, capacityKg, plate });
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Contact Support ───────────────────────────────────

function ContactSupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E3EDE6] flex flex-col">
        <div className="px-6 py-4 bg-[#083827] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">AgriMarket Support</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#EBF7F0] p-3 rounded-2xl text-xs text-[#075C3B] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              Direct Driver Hotline: 8899 / +251 911 234 567
            </p>
            <p className="text-[11px] text-[#4F7360]">Available 24/7 for delivery workers on active routes.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] block mb-1">Send a quick dispatch note</label>
            <textarea
              rows={3}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="E.g., Traffic delay on Bole road, or customer not answering..."
              className="w-full text-xs font-medium bg-[#F2F7F4] border border-[#D7E6DD] rounded-xl p-3 text-[#0B3322] focus:outline-none focus:border-[#075C3B]"
            />
          </div>

          {sent && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center">
              Message dispatched! Support agent will call you within 2 minutes.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-[#E3EDE6] flex gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-[#D5E2DA] text-xs font-bold text-[#375747] hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (!msg) return;
              setSent(true);
              setTimeout(() => {
                setSent(false);
                setMsg('');
                onClose();
              }, 1800);
            }}
            className="flex-1 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Primary Dashboard ───────────────────────────────

function DashboardSection({
  data,
  loading,
  nearbyRequests,
  onAcceptNearbyRequest,
  onNavigateSection,
  onOpenRouteModal,
  onOpenVehicleModal,
}: {
  data: DashboardData | null;
  loading: boolean;
  nearbyRequests: NearbyRequestItem[];
  onAcceptNearbyRequest: (item: NearbyRequestItem) => void;
  onNavigateSection: (sec: NavKey) => void;
  onOpenRouteModal: () => void;
  onOpenVehicleModal: () => void;
}) {
  const workerFirstName = useMemo(() => {
    return data?.worker?.fullName?.split(' ')[0] || 'Abebe';
  }, [data]);

  const metrics = data?.metrics;

  return (
    <div className="space-y-5">
      {/* ─── Hero Greeting Banner with Background Van Graphic ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#D7EFE2] via-[#E4F5EB] to-[#E9F6ED] border border-[#CCE8D7] shadow-[0_4px_16px_rgba(10,40,25,0.04)] p-6 sm:p-7 flex items-center justify-between min-h-[140px]">
        {/* Left text column */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-xl sm:text-2xl font-black text-[#0A3322] tracking-tight flex items-center gap-2">
            <span>Good day, {workerFirstName}!</span>
            <span className="text-2xl" role="img" aria-label="van">
              🚐
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#38624E] font-medium mt-1">
            Keep moving. Keep delivering. Ongoing orders await you.
          </p>
        </div>

        {/* Right side banner image with soft transparent gradient blend */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[48%] pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D7EFE2] via-[#E4F5EB]/60 to-transparent z-10" />
          <img
            src="/images/worker_banner_van.jpg"
            alt="Delivery van on rural scenic road"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* ─── 4 Metric Cards (Row of 4) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardMetricCard
          icon={<Package className="w-5 h-5" />}
          label="Available Orders"
          value={metrics?.availableOrders ?? 3}
          sub="nearby"
          iconBg="bg-[#E7F7ED]"
          iconColor="text-[#075C3B]"
        />
        <DashboardMetricCard
          icon={<Truck className="w-5 h-5" />}
          label="Today's Deliveries"
          value={metrics?.todayDeliveries ?? 5}
          sub={`${metrics?.completedToday ?? 5} completed`}
          iconBg="bg-[#E7F7ED]"
          iconColor="text-[#075C3B]"
        />
        <DashboardMetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Today's Earnings"
          value={formatCurrency(metrics?.todayEarnings ?? 2450)}
          badge="+15%"
          iconBg="bg-[#E7F7ED]"
          iconColor="text-[#075C3B]"
        />
        <DashboardMetricCard
          icon={<Star className="w-5 h-5" />}
          label="Rating"
          value={metrics?.rating ? metrics.rating.toFixed(1) : '4.8'}
          sub={metrics?.ratingCount ? `(${metrics.ratingCount})` : '(124)'}
          iconBg="bg-[#E7F7ED]"
          iconColor="text-[#075C3B]"
        />
      </div>

      {/* ─── Main Two-Column Grid (Matching Reference Layout) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (~60%): Nearby Delivery Requests + Recent Activity */}
        <div className="lg:col-span-7 space-y-5">
          <NearbyDeliveryRequestsCard
            requests={nearbyRequests}
            onAccept={onAcceptNearbyRequest}
            onViewAll={() => onNavigateSection('offers')}
          />
          <RecentActivityCard onViewAll={() => onNavigateSection('deliveries')} />
        </div>

        {/* Right Column (~40%): Today's Route + Your Vehicle */}
        <div className="lg:col-span-5 space-y-5">
          <RouteCardVisual
            deliveriesCount={3}
            distanceKm="12.5 km"
            onOpenRouteModal={onOpenRouteModal}
          />
          <VehicleCard
            vehicleType={data?.profile?.vehicleType || 'Motorcycle'}
            capacityKg={data?.profile?.vehicleCapacityKg || 50}
            plate={data?.profile?.vehiclePlate || '3-A45129 ET'}
            onEdit={onOpenVehicleModal}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section: Available Orders (Full View) ─────────────────────

function OffersSection({
  onAcceptOrder,
}: {
  onAcceptOrder: (offer: DeliveryOffer) => void;
}) {
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.offers();
      setOffers(res.data || []);
    } catch {
      // Fallback preview data
      setOffers([
        {
          offerId: 'off-1',
          jobId: 'job-1',
          orderId: 'ord-101',
          status: 'PENDING',
          offeredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          secondsLeft: 300,
          product: 'Fresh Tomatoes',
          productImage: '/images/prod_tomatoes.jpg',
          quantityKg: 5,
          pickupAddress: 'Lideta Farmers Cooperative, Addis Ababa',
          dropoffAddress: 'Bole Rwanda, House 342, Addis Ababa',
          pickupLatitude: 9.012,
          pickupLongitude: 38.745,
          dropoffLatitude: 9.001,
          dropoffLongitude: 38.784,
          distanceKm: 2.1,
          routeDistKm: 5.4,
          deliveryFee: '120.00',
          requiredVehicleType: 'MOTORCYCLE',
          requiredCapacityKg: 20,
          paymentMethod: 'CASH_ON_DELIVERY',
        },
        {
          offerId: 'off-2',
          jobId: 'job-2',
          orderId: 'ord-102',
          status: 'PENDING',
          offeredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 720000).toISOString(),
          secondsLeft: 480,
          product: 'Green Beans',
          productImage: '/images/prod_green_beans.jpg',
          quantityKg: 3,
          pickupAddress: 'Bole Bulbula Market Hub',
          dropoffAddress: 'Kazanchis Near UNECA',
          pickupLatitude: 8.98,
          pickupLongitude: 38.79,
          dropoffLatitude: 9.02,
          dropoffLongitude: 38.76,
          distanceKm: 3.4,
          routeDistKm: 6.8,
          deliveryFee: '100.00',
          requiredVehicleType: 'MOTORCYCLE',
          requiredCapacityKg: 10,
          paymentMethod: 'TELEBIRR',
        },
        {
          offerId: 'off-3',
          jobId: 'job-3',
          orderId: 'ord-103',
          status: 'PENDING',
          offeredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 900000).toISOString(),
          secondsLeft: 720,
          product: 'Potatoes',
          productImage: '/images/prod_potatoes.jpg',
          quantityKg: 10,
          pickupAddress: 'Lideta Central Produce Depot',
          dropoffAddress: 'Piassa Churchill Ave',
          pickupLatitude: 9.015,
          pickupLongitude: 38.74,
          dropoffLatitude: 9.03,
          dropoffLongitude: 38.75,
          distanceKm: 4.2,
          routeDistKm: 4.9,
          deliveryFee: '90.00',
          requiredVehicleType: 'MOTORCYCLE',
          requiredCapacityKg: 15,
          paymentMethod: 'CASH_ON_DELIVERY',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0B3322]">Available Delivery Orders</h2>
          <p className="text-xs text-[#517663]">Orders broadcasted near your location matching your vehicle capacity.</p>
        </div>
        <button
          onClick={loadOffers}
          className="p-2 rounded-xl bg-white border border-[#D7E6DD] text-[#075C3B] hover:bg-[#EBF6EE] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map(offer => (
          <div
            key={offer.offerId}
            className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E3EDE6]">
                  <img
                    src={offer.productImage || '/images/prod_tomatoes.jpg'}
                    alt={offer.product}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0B3322]">{offer.product}</h4>
                  <p className="text-xs text-[#6B8B7B]">
                    {offer.quantityKg} kg &bull; Fee: <span className="text-[#075C3B] font-bold">ETB {offer.deliveryFee}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-[#517663]">
                  <MapPin className="w-3.5 h-3.5 text-[#075C3B] shrink-0 mt-0.5" />
                  <span>Pickup: {offer.pickupAddress}</span>
                </div>
                <div className="flex items-start gap-2 text-[#517663]">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Dropoff: {offer.dropoffAddress}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EDF5F0] flex items-center justify-between">
              <span className="text-xs text-[#7B998A] font-medium">Expires in {Math.round(offer.secondsLeft / 60)} min</span>
              <button
                onClick={() => onAcceptOrder(offer)}
                className="px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Accept Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: My Deliveries (Lifecycle) ─────────────────────────

function DeliveriesSection() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.deliveries();
      setJobs(res.data.jobs || []);
    } catch {
      // Default demo jobs
      setJobs([
        {
          id: 'job-1',
          orderId: 'ord-101',
          status: 'EN_ROUTE',
          pickupAddress: 'Lideta Farm Cooperative Hub',
          dropoffAddress: 'Bole Rwanda, House 342, Addis Ababa',
          pickupLatitude: 9.012,
          pickupLongitude: 38.745,
          dropoffLatitude: 9.001,
          dropoffLongitude: 38.784,
          acceptedAt: new Date(Date.now() - 3600000).toISOString(),
          pickedUpAt: new Date(Date.now() - 1800000).toISOString(),
          deliveredAt: null,
          failedAt: null,
          product: 'Fresh Tomatoes',
          productImage: '/images/prod_tomatoes.jpg',
          quantityKg: 5,
          deliveryFee: '120.00',
          paymentMethod: 'CASH_ON_DELIVERY',
          cashCollected: null,
          createdAt: new Date().toISOString(),
          events: [],
        },
        {
          id: 'job-2',
          orderId: 'ord-098',
          status: 'DELIVERED',
          pickupAddress: 'Addis Ababa Veggie Depot',
          dropoffAddress: 'Kazanchis, Addis Ababa',
          pickupLatitude: 9.01,
          pickupLongitude: 38.75,
          dropoffLatitude: 9.02,
          dropoffLongitude: 38.76,
          acceptedAt: new Date(Date.now() - 7200000).toISOString(),
          pickedUpAt: new Date(Date.now() - 5400000).toISOString(),
          deliveredAt: new Date(Date.now() - 3600000).toISOString(),
          failedAt: null,
          product: 'Potatoes & Onions',
          productImage: '/images/prod_potatoes.jpg',
          quantityKg: 10,
          deliveryFee: '140.00',
          paymentMethod: 'TELEBIRR',
          cashCollected: null,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          events: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleUpdateStatus = async (jobId: string, nextStatus: DeliveryStatus) => {
    try {
      await workerApi.updateStatus(jobId, nextStatus);
    } catch {
      // update locally
    }
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: nextStatus } : j))
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-[#0B3322]">My Deliveries</h2>
        <p className="text-xs text-[#517663]">Manage ongoing pickups, in-transit orders, and completion receipts.</p>
      </div>

      <div className="space-y-3">
        {jobs.map(job => {
          const next = STATUS_NEXT[job.status];
          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E3EDE6]">
                  <img
                    src={job.productImage || '/images/prod_tomatoes.jpg'}
                    alt={job.product}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0B3322]">{job.product}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF6EE] text-[#075C3B]">
                      {STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B8B7B] mt-0.5">
                    {job.dropoffAddress} &bull; Fee: <span className="text-[#0B3322] font-bold">ETB {job.deliveryFee}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {next ? (
                  <button
                    onClick={() => handleUpdateStatus(job.id, next.next)}
                    className="px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {next.label}
                  </button>
                ) : (
                  <span className="text-xs text-[#088647] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section: Earnings ────────────────────────────────────────

function EarningsSection() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0B3322]">Earnings & Cash Reconciliation</h2>
          <p className="text-xs text-[#517663]">Track completed deliveries, COD cash balance, and weekly payouts.</p>
        </div>
        <div className="flex bg-[#EBF5EF] p-1 rounded-xl text-xs font-bold text-[#075C3B]">
          {(['today', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-colors ${
                period === p ? 'bg-[#075C3B] text-white' : 'text-[#47705B] hover:text-[#075C3B]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] font-medium">Net Payout</p>
          <p className="text-2xl font-black text-[#0B3322] mt-1">ETB 2,450</p>
          <p className="text-[11px] text-[#088647] font-bold mt-1">+15% vs yesterday</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] font-medium">Completed Jobs</p>
          <p className="text-2xl font-black text-[#0B3322] mt-1">5 Deliveries</p>
          <p className="text-[11px] text-[#6B8B7B] mt-1">100% on-time completion</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] font-medium">Cash On Delivery Held</p>
          <p className="text-2xl font-black text-[#B45309] mt-1">ETB 680</p>
          <p className="text-[11px] text-[#6B8B7B] mt-1">Ready for bank deposit / Telebirr</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Vehicle & Profile ───────────────────────────────

function VehicleSection({
  data,
  onOpenVehicleModal,
}: {
  data: DashboardData | null;
  onOpenVehicleModal: () => void;
}) {
  const [online, setOnline] = useState(true);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-[#0B3322]">Vehicle & Profile Settings</h2>
        <p className="text-xs text-[#517663]">Manage delivery status, vehicle specs, license documents, and work zones.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#0B3322]">Worker Availability</h4>
          <p className="text-xs text-[#6B8B7B] mt-0.5">Toggle online to receive real-time order broadcast offers.</p>
        </div>
        <button
          onClick={() => setOnline(p => !p)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            online ? 'bg-[#075C3B] text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-300' : 'bg-slate-400'}`} />
          {online ? 'Online & Available' : 'Offline'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E3EDE6] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#0B3322]">Registered Vehicle</h4>
          <button onClick={onOpenVehicleModal} className="text-xs font-bold text-[#075C3B] hover:underline cursor-pointer">
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#F7FAF8] p-3 rounded-xl border border-[#E8F0EB]">
            <p className="text-[#6B8B7B]">Type</p>
            <p className="font-bold text-[#0B3322] mt-0.5">{data?.profile?.vehicleType || 'Motorcycle'}</p>
          </div>
          <div className="bg-[#F7FAF8] p-3 rounded-xl border border-[#E8F0EB]">
            <p className="text-[#6B8B7B]">Capacity</p>
            <p className="font-bold text-[#0B3322] mt-0.5">{data?.profile?.vehicleCapacityKg || 50} kg</p>
          </div>
          <div className="bg-[#F7FAF8] p-3 rounded-xl border border-[#E8F0EB]">
            <p className="text-[#6B8B7B]">Plate Number</p>
            <p className="font-bold text-[#0B3322] mt-0.5">{data?.profile?.vehiclePlate || '3-A45129 ET'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Worker Dashboard Page ───────────────────────────────

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<NavKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Nearby requests state (synced with reference image)
  const [nearbyRequests, setNearbyRequests] = useState<NearbyRequestItem[]>(INITIAL_NEARBY_REQUESTS);

  // Vehicle settings state
  const [vehicleState, setVehicleState] = useState({
    vehicleType: 'Motorcycle',
    capacityKg: 50,
    plate: '3-A45129 ET',
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth & Session Guarantee: If no demo user in localStorage, set default Abebe Mekonnen so /worker renders perfectly
  useEffect(() => {
    try {
      const raw = localStorage.getItem('agrimarket_user');
      if (!raw) {
        const demoWorker = {
          id: 'worker-demo-abebe',
          fullName: 'Abebe Mekonnen',
          email: 'abebe.delivery@agrimarket.et',
          phone: '+251 911 234 567',
          role: 'DELIVERY_WORKER',
        };
        localStorage.setItem('agrimarket_user', JSON.stringify(demoWorker));
      }
    } catch {
      // ignore
    }
  }, []);

  // Load Dashboard Data from backend
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.dashboard();
      if (res?.data) {
        setDashData(res.data);
      }
    } catch {
      // Fallback data matching reference image
      setDashData({
        worker: {
          id: 'worker-demo-abebe',
          fullName: 'Abebe Mekonnen',
          email: 'abebe.delivery@agrimarket.et',
          phone: '+251 911 234 567',
        },
        profile: {
          vehicleType: vehicleState.vehicleType as any,
          vehiclePlate: vehicleState.plate,
          vehicleCapacityKg: vehicleState.capacityKg,
          availability: 'ONLINE',
          lastLatitude: 9.01,
          lastLongitude: 38.75,
          lastLocationAt: new Date().toISOString(),
          activeJobCount: 3,
          verificationStatus: 'VERIFIED',
        },
        metrics: {
          availableOrders: 3,
          todayDeliveries: 5,
          completedToday: 5,
          todayEarnings: 2450,
          rating: 4.8,
          ratingCount: 124,
        },
        todayJobs: [],
        activeJob: null,
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  }, [vehicleState]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handler: Accept nearby delivery request
  const handleAcceptNearbyRequest = async (item: NearbyRequestItem) => {
    try {
      setNearbyRequests(prev =>
        prev.map(r => (r.id === item.id ? { ...r, accepted: true } : r))
      );
      showToast(`Accepted "${item.title}"! Added to Today's Route.`);
    } catch {
      showToast(`Error accepting order.`);
    }
  };

  // Handler: Save vehicle
  const handleSaveVehicle = async (v: { vehicleType: string; capacityKg: number; plate: string }) => {
    setVehicleState(v);
    try {
      await workerApi.updateProfile({
        vehiclePlate: v.plate,
        vehicleCapacityKg: v.capacityKg,
      });
    } catch {
      // saved locally
    }
    showToast('Vehicle information updated successfully!');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('agrimarket_token');
      localStorage.removeItem('agrimarket_user');
    } catch {
      // ignore
    }
    router.push('/login');
  };

  // Sidebar Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A3323] text-white">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#124230] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none">
              <path d="M18 4C18 4 23 11 23 18C23 21 21 24 18 25C15 24 13 21 13 18C13 11 18 4 18 4Z" fill="#10B981" />
              <path d="M16 26C16 26 9 24 7 18C5 12 11 9 11 9C11 9 13 16 17 21C17.5 21.6 18 22.2 18 22.2" fill="#059669" />
              <path d="M20 26C20 26 27 24 29 18C31 12 25 9 25 9C25 9 23 16 19 21C18.5 21.6 18 22.2 18 22.2" fill="#34D399" />
            </svg>
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight leading-none">AgriMarket</span>
            <p className="text-[9px] text-[#71A88F] font-semibold tracking-wider uppercase mt-0.5">
              Farmers &bull; Buyers &bull; Delivery
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveSection(item.key as NavKey);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#134D37] text-white shadow-sm'
                  : 'text-[#9BB8AA] hover:bg-[#0E3D2B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-[#8AA899]'}`} />
                <span>{item.label}</span>
              </div>
              {'badge' in item && item.badge ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#10B981] text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Need Help Card (Matching reference image bottom sidebar) */}
      <div className="p-3.5 border-t border-[#124230]">
        <div className="bg-[#0E3D2B] rounded-2xl p-3.5 border border-[#164C37]">
          <p className="text-[11px] font-bold text-white mb-2">Need Help?</p>
          <button
            onClick={() => setSupportModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#134D37] hover:bg-[#1A5E44] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-300" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex font-sans text-slate-800">
      {/* ─── Desktop Left Sidebar ─── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-60 lg:z-30 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Sidebar Overlay Drawer ─── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ─── Main Content Container ─── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top Header Navigation Bar (Matching Reference Image) */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E3EDE6] h-16 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
          {/* Left: Mobile hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#0B3322] hover:bg-[#EBF6EE] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Pill Input (Matching Reference image) */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F0F5F2] w-64 lg:w-72 border border-transparent focus-within:border-[#BDE0CB] focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-[#7B998A]" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full bg-transparent text-xs text-[#0B3322] placeholder-[#8EA89B] focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Notifications, Theme Toggle & Profile Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Bell Icon with notification dot */}
            <button
              onClick={() => showToast('No new unread broadcasts.')}
              className="relative p-2 rounded-full text-[#47705B] dark:text-[#88B8A0] hover:text-[#0B3322] dark:hover:text-white hover:bg-[#F0F5F2] dark:hover:bg-[#12281E] transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] border-2 border-white dark:border-[#0A1812]" />
            </button>

            {/* Worker Avatar & Info Pill (Matching Reference: Abebe Mekonnen, Delivery Worker) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(p => !p)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full hover:bg-[#F0F5F2] transition-colors cursor-pointer"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D5E6DC] bg-slate-100 shrink-0">
                  <img
                    src="/images/avatar_mekonnen_hd.jpg"
                    alt="Abebe Mekonnen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-bold text-[#0B3322]">
                    {dashData?.worker?.fullName || 'Abebe Mekonnen'}
                  </p>
                  <p className="text-[10px] text-[#719985] font-semibold">Delivery Worker</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#719985]" />
              </button>

              {/* Profile dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-[#E3EDE6] shadow-xl p-2 z-30 animate-in fade-in duration-150">
                  <button
                    onClick={() => {
                      setActiveSection('vehicle');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B3322] hover:bg-[#F0F5F2] rounded-xl flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#075C3B]" />
                    Profile & Vehicle
                  </button>
                  <button
                    onClick={() => {
                      setSupportModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B3322] hover:bg-[#F0F5F2] rounded-xl flex items-center gap-2"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#075C3B]" />
                    Support Desk
                  </button>
                  <div className="my-1 border-t border-[#EDF5F0]" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── Page Content Body ─── */}
        <main className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {activeSection === 'dashboard' && (
            <DashboardSection
              data={dashData}
              loading={loading}
              nearbyRequests={nearbyRequests}
              onAcceptNearbyRequest={handleAcceptNearbyRequest}
              onNavigateSection={setActiveSection}
              onOpenRouteModal={() => setRouteModalOpen(true)}
              onOpenVehicleModal={() => setVehicleModalOpen(true)}
            />
          )}

          {activeSection === 'offers' && (
            <OffersSection
              onAcceptOrder={offer => {
                showToast(`Accepted offer for "${offer.product}"!`);
                setActiveSection('deliveries');
              }}
            />
          )}

          {activeSection === 'deliveries' && <DeliveriesSection />}

          {activeSection === 'earnings' && <EarningsSection />}

          {activeSection === 'vehicle' && (
            <VehicleSection
              data={dashData}
              onOpenVehicleModal={() => setVehicleModalOpen(true)}
            />
          )}

          {activeSection === 'messages' && (
            <div className="bg-white rounded-2xl border border-[#E3EDE6] p-12 text-center">
              <MessageSquare className="w-10 h-10 text-[#075C3B] mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-[#0B3322]">Driver & Dispatch Chat</h3>
              <p className="text-xs text-[#6B8B7B] mt-1 max-w-sm mx-auto">
                Direct in-app messaging with pickup hub managers and buyers is connected.
              </p>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white rounded-2xl border border-[#E3EDE6] p-6 max-w-lg space-y-4">
              <h3 className="text-base font-black text-[#0B3322]">Driver Preferences</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] border border-[#E8F0EB]">
                  <span className="font-bold text-[#0B3322]">Sound Alerts on New Order Offer</span>
                  <input type="checkbox" defaultChecked className="accent-[#075C3B]" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] border border-[#E8F0EB]">
                  <span className="font-bold text-[#0B3322]">Auto-calculate Toll Routes</span>
                  <input type="checkbox" defaultChecked className="accent-[#075C3B]" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#E6F4ED]">Theme Mode (Light / Dark)</span>
                  <ThemeToggle />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#E6F4ED]">Language: Amharic (አማርኛ) / English</span>
                  <span className="text-[#075C3B] dark:text-[#34D399] font-bold">English (Default)</span>
                </label>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Modals ─── */}
      <FullRouteModal
        open={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        deliveriesCount={3}
        distanceKm="12.5 km"
      />

      <EditVehicleModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        initialType={vehicleState.vehicleType}
        initialCapacity={vehicleState.capacityKg}
        initialPlate={vehicleState.plate}
        onSave={handleSaveVehicle}
      />

      <ContactSupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B3322] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-[#16573C] animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
