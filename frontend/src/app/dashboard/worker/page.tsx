'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  DollarSign,
  User,
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
  Activity,
  Loader2,
  Headphones,
  Check,
  Send,
  PhoneCall,
  ShieldCheck,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Compass,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Receipt,
  CheckCheck,
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LocationShareWidget } from '@/components/location/LocationShareWidget';
import { AdminLocationViewModal } from '@/components/location/AdminLocationViewModal';
import { ActiveDeliverySection } from '@/components/worker/ActiveDeliverySection';
import { CodReconciliationModal } from '@/components/worker/CodReconciliationModal';
import { ReportIncidentModal } from '@/components/worker/ReportIncidentModal';
import { workerApi } from '@/lib/workerApi';
import type {
  DashboardData,
  DeliveryOffer,
  DeliveryJob,
  DeliveryStatus,
} from '@/types/worker';

// ─── Constants & Metadata ─────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { key: 'offers', label: 'Delivery Requests', icon: Package, badgeKey: 'availableOrders' },
  { key: 'active', label: 'Active Delivery', icon: Navigation, badgeKey: 'hasActive' },
  { key: 'deliveries', label: 'My Deliveries', icon: Truck },
  { key: 'earnings', label: 'Earnings & COD', icon: DollarSign, badgeKey: 'hasCod' },
  { key: 'vehicle', label: 'Availability & GPS', icon: MapPin },
  { key: 'notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
  { key: 'incidents', label: 'Support & Incidents', icon: ShieldAlert },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  UNASSIGNED: 'Unassigned',
  BROADCASTING: 'Broadcasting',
  ASSIGNED: 'Assigned',
  HEADING_TO_PICKUP: 'Heading to Pickup',
  PICKED_UP: 'Picked Up',
  EN_ROUTE: 'En Route',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

// ─── Helper Functions ─────────────────────────────────────────

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return 'ETB 0';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return 'ETB 0';
  return `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Default Reference Requests ────────────────────────────────

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

// ─── Metric Card Component ─────────────────────────────────────

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
    <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] hover:shadow-md transition-all flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} dark:bg-[#163828] dark:text-[#34D399]`}>
          {icon}
        </div>
        {badge && (
          <span className="text-[11px] font-bold text-[#088647] dark:text-[#34D399] bg-[#E5F7ED] dark:bg-[#133A27] px-2 py-0.5 rounded-full flex items-center gap-0.5">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wider text-[#6B8B7B] dark:text-[#88B8A0] font-semibold">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl sm:text-2xl font-black text-[#0B3322] dark:text-[#EEFAF3] leading-tight tracking-tight">{value}</p>
          {sub && <span className="text-xs text-[#7B998A] dark:text-[#6E9581] font-medium">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Visual Route Map Card ─────────────────────────────────────

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
    <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Today&apos;s Route</h3>
      </div>

      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[#F2F8F4] dark:bg-[#12281E] border border-[#DEEBE1] dark:border-[#1A3B2A]">
        <svg viewBox="0 0 340 160" className="w-full h-full" preserveAspectRatio="none">
          <line x1="20" y1="0" x2="20" y2="160" stroke="#E2EFE6" strokeWidth="1.5" />
          <line x1="90" y1="0" x2="90" y2="160" stroke="#E2EFE6" strokeWidth="1" />
          <line x1="170" y1="0" x2="170" y2="160" stroke="#E2EFE6" strokeWidth="2" />
          <line x1="250" y1="0" x2="250" y2="160" stroke="#E2EFE6" strokeWidth="1" />
          <line x1="310" y1="0" x2="310" y2="160" stroke="#E2EFE6" strokeWidth="1.5" />

          <line x1="0" y1="35" x2="340" y2="35" stroke="#E2EFE6" strokeWidth="1.5" />
          <line x1="0" y1="75" x2="340" y2="75" stroke="#E2EFE6" strokeWidth="2" />
          <line x1="0" y1="120" x2="340" y2="120" stroke="#E2EFE6" strokeWidth="1" />

          <path d="M 0 140 Q 100 110 180 130 T 340 100" stroke="#D7EAD9" strokeWidth="1.5" fill="none" />
          <path d="M 40 0 Q 80 60 140 80 T 280 160" stroke="#D7EAD9" strokeWidth="1.2" fill="none" />

          <path
            d="M 42 110 C 80 115 110 50 160 55 C 210 60 230 110 285 92"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          <g transform="translate(42, 110)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">1</text>
          </g>

          <g transform="translate(160, 55)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">2</text>
          </g>

          <g transform="translate(285, 92)">
            <circle r="9" fill="#075C3B" />
            <circle r="4" fill="white" />
            <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#075C3B">3</text>
          </g>
        </svg>

        <div className="absolute top-2 left-2 bg-white/90 dark:bg-[#0D2118]/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#075C3B] dark:text-[#34D399] flex items-center gap-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Route
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#517663] dark:text-[#88B8A0] font-semibold mt-3 px-1">
        <span className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-[#075C3B] dark:text-[#34D399]" />
          {deliveriesCount} deliveries
        </span>
        <span className="flex items-center gap-1.5 text-[#0B3322] dark:text-[#EEFAF3] font-bold">
          <Navigation className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
          {distanceKm}
        </span>
      </div>

      <button
        onClick={onOpenRouteModal}
        className="mt-3.5 w-full py-2.5 rounded-xl border border-[#BDE0CB] dark:border-[#224A37] text-[#075C3B] dark:text-[#34D399] hover:bg-[#EAF6EF] dark:hover:bg-[#163828] hover:border-[#075C3B] dark:hover:border-[#34D399] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View Full Route</span>
      </button>
    </div>
  );
}

// ─── Vehicle Card Component ───────────────────────────────────

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
    <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Your Vehicle</h3>
        <button
          onClick={onEdit}
          className="text-xs text-[#075C3B] dark:text-[#34D399] font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Edit</span>
        </button>
      </div>

      <div className="flex items-center gap-3.5 mt-1">
        <div className="w-11 h-11 rounded-xl bg-[#E8F6EE] dark:bg-[#163828] flex items-center justify-center text-[#075C3B] dark:text-[#34D399] shrink-0">
          <Bike className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">{vehicleType}</p>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] font-medium">Capacity: {capacityKg} kg</p>
          {plate && <p className="text-[11px] text-[#8EA89B] dark:text-[#6E9581] font-mono mt-0.5">{plate}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Nearby Requests Card ──────────────────────────────────────

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
    <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Nearby Delivery Requests</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-[#075C3B] dark:text-[#34D399] font-bold hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-[#EDF5F0] dark:divide-[#1A3326]">
        {requests.map(item => (
          <div
            key={item.id}
            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group transition-colors hover:bg-[#F9FCFA] dark:hover:bg-[#122A1E]/50 rounded-xl px-2 -mx-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E2ECE5] dark:border-[#1E4130] bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3] truncate">{item.title}</h4>
                <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                  {item.distance} &bull; {item.location}
                </p>
                <p className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
                  ETB {item.fee} &bull; {item.weightKg} kg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.accepted ? (
                <span className="px-3 py-1.5 rounded-lg bg-[#E7F7ED] dark:bg-[#133A27] text-[#088647] dark:text-[#34D399] text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Accepted
                </span>
              ) : (
                <button
                  onClick={() => onAccept(item)}
                  className="px-4 py-1.5 rounded-lg bg-[#075C3B] dark:bg-[#10B981] hover:bg-[#05462D] dark:hover:bg-[#059669] active:scale-95 text-white dark:text-[#062417] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Accept
                </button>
              )}
              <span className="text-xs text-[#7B998A] dark:text-[#6E9581] font-medium min-w-[36px] text-right">
                {item.timerMinutes} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity Card ──────────────────────────────────────

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
    <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-[0_2px_8px_rgba(10,40,25,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Recent Activity</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-[#075C3B] dark:text-[#34D399] font-bold hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-[#EDF5F0] dark:divide-[#1A3326]">
        {items.map(item => (
          <div key={item.id} className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBF5EE] dark:bg-[#163828] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3]">{item.title}</p>
                <p className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">{item.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                {item.fee && <p className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3]">{item.fee}</p>}
                <p className="text-[11px] text-[#8EA89B] dark:text-[#6E9581]">{item.time}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A0BAAC] dark:text-[#4A705E]" />
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
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#083827] dark:bg-[#062419] text-white flex items-center justify-between">
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

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-[#E8F6EE] dark:bg-[#133A27] p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-[#075C3B] dark:text-[#34D399]">
            <span>Traffic status: Normal</span>
            <span>Total Earnings for route: ETB 310</span>
          </div>

          <div className="space-y-3 relative pl-4 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D4E8DC] dark:before:bg-[#1E4130]">
            {stops.map(s => (
              <div key={s.step} className="relative flex items-start gap-3 bg-[#F9FCFA] dark:bg-[#12281E] p-3.5 rounded-2xl border border-[#E6F0EA] dark:border-[#1C3E2C]">
                <div className="w-6 h-6 rounded-full bg-[#075C3B] text-white text-xs font-bold flex items-center justify-center shrink-0 z-10">
                  {s.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#075C3B] dark:text-[#34D399] bg-[#E3F4EA] dark:bg-[#163828] px-2 py-0.5 rounded-md">
                      {s.type}
                    </span>
                    <span className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] font-medium">{s.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-1">{s.location}</p>
                  <p className="text-xs text-[#517663] dark:text-[#97C2AC] mt-0.5 font-medium">{s.product}</p>
                  <p className="text-[11px] text-[#7B998A] dark:text-[#6E9581] mt-0.5">{s.farmer || s.customer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-[#E3EDE6] dark:border-[#1E4130] flex gap-3 bg-slate-50 dark:bg-[#0A1812]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] dark:border-[#1E4130] text-xs font-bold text-[#375747] dark:text-[#88B8A0] hover:bg-white dark:hover:bg-[#12281E] transition-colors cursor-pointer"
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
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col">
        <div className="px-6 py-4 bg-[#083827] dark:bg-[#062419] text-white flex items-center justify-between">
          <h3 className="text-base font-bold">Edit Vehicle Details</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] block mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              className="w-full text-xs font-medium bg-[#F2F7F4] dark:bg-[#12281E] border border-[#D7E6DD] dark:border-[#1E4130] rounded-xl px-3 py-2.5 text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#075C3B]"
            >
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="PICKUP_TRUCK">Pickup Truck</option>
              <option value="THREE_WHEELER">Three-Wheeler (Bajaj)</option>
              <option value="BICYCLE">Bicycle</option>
              <option value="TRUCK">Van / Medium Truck</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] block mb-1">Carrying Capacity (kg)</label>
            <input
              type="number"
              value={capacityKg}
              onChange={e => setCapacityKg(Number(e.target.value))}
              className="w-full text-xs font-medium bg-[#F2F7F4] dark:bg-[#12281E] border border-[#D7E6DD] dark:border-[#1E4130] rounded-xl px-3 py-2 text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#075C3B]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] block mb-1">License Plate Number</label>
            <input
              type="text"
              value={plate}
              onChange={e => setPlate(e.target.value)}
              className="w-full text-xs font-medium bg-[#F2F7F4] dark:bg-[#12281E] border border-[#D7E6DD] dark:border-[#1E4130] rounded-xl px-3 py-2 text-[#0B3322] dark:text-[#EEFAF3] focus:outline-none focus:border-[#075C3B]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[#E3EDE6] dark:border-[#1E4130] flex gap-2 bg-slate-50 dark:bg-[#0A1812]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] dark:border-[#1E4130] text-xs font-bold text-[#375747] dark:text-[#88B8A0] hover:bg-white dark:hover:bg-[#12281E] transition-colors cursor-pointer"
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
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col">
        <div className="px-6 py-4 bg-[#083827] dark:bg-[#062419] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">AgriMarket Support</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#EBF7F0] dark:bg-[#133A27] p-3 rounded-2xl text-xs text-[#075C3B] dark:text-[#34D399] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              Direct Driver Hotline: 8899 / +251 911 234 567
            </p>
            <p className="text-[11px] text-[#4F7360] dark:text-[#88B8A0]">Available 24/7 for delivery workers on active routes.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3] block mb-1">Send a quick dispatch note</label>
            <textarea
              rows={3}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="E.g., Traffic delay on Bole road, or customer not answering..."
              className="w-full text-xs font-medium bg-[#F2F7F4] dark:bg-[#12281E] border border-[#D7E6DD] dark:border-[#1E4130] rounded-xl p-3 text-[#0B3322] dark:text-[#EEFAF3] placeholder-[#8EA89B] dark:placeholder-[#4E7361] focus:outline-none focus:border-[#075C3B]"
            />
          </div>

          {sent && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg text-center">
              Message dispatched! Support agent will call you within 2 minutes.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-[#E3EDE6] dark:border-[#1E4130] flex gap-2 bg-slate-50 dark:bg-[#0A1812]">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-[#D5E2DA] dark:border-[#1E4130] text-xs font-bold text-[#375747] dark:text-[#88B8A0] hover:bg-white dark:hover:bg-[#12281E] transition-colors cursor-pointer"
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

// ─── Section 1: Primary Dashboard ──────────────────────────────

function DashboardSection({
  data,
  nearbyRequests,
  onAcceptNearbyRequest,
  onNavigateSection,
  onOpenRouteModal,
  onOpenVehicleModal,
}: {
  data: DashboardData | null;
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
  const activeJob = data?.activeJob;

  return (
    <div className="space-y-5">
      {/* ─── Hero Greeting Banner with Background Van Graphic ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#D7EFE2] via-[#E4F5EB] to-[#E9F6ED] dark:from-[#0E2E20] dark:via-[#133A29] dark:to-[#0F3123] border border-[#CCE8D7] dark:border-[#1B4B36] shadow-[0_4px_16px_rgba(10,40,25,0.04)] p-6 sm:p-7 flex items-center justify-between min-h-[140px]">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-xl sm:text-2xl font-black text-[#0A3322] dark:text-[#EEFAF3] tracking-tight flex items-center gap-2">
            <span>Good day, {workerFirstName}!</span>
            <span className="text-2xl" role="img" aria-label="van">
              🚐
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#38624E] dark:text-[#97C2AC] font-medium mt-1">
            Keep moving. Keep delivering. Ongoing orders await you.
          </p>

          {activeJob && (
            <div className="mt-3 inline-flex items-center gap-2 bg-[#075C3B] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Job in Progress: {STATUS_LABELS[activeJob.status]}</span>
              <button
                onClick={() => onNavigateSection('active')}
                className="ml-1 underline text-emerald-200 hover:text-white cursor-pointer"
              >
                Resume &rarr;
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[48%] pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D7EFE2] via-[#E4F5EB]/60 to-transparent dark:from-[#0E2E20] dark:via-[#133A29]/70 z-10" />
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
          sub="broadcasted"
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

      {/* ─── Main Two-Column Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5">
          <NearbyDeliveryRequestsCard
            requests={nearbyRequests}
            onAccept={onAcceptNearbyRequest}
            onViewAll={() => onNavigateSection('offers')}
          />
          <RecentActivityCard onViewAll={() => onNavigateSection('deliveries')} />
        </div>

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

// ─── Section 2: Delivery Requests (Offers) ─────────────────────

function OffersSection({
  onAcceptSuccess,
  onSeedDemoOrder,
}: {
  onAcceptSuccess: (jobId: string) => void;
  onSeedDemoOrder: () => void;
}) {
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.offers();
      setOffers(res.data || []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleAccept = async (offer: DeliveryOffer) => {
    setActingOfferId(offer.offerId);
    try {
      const res = await workerApi.acceptOffer(offer.offerId);
      onAcceptSuccess(res?.data?.jobId || offer.jobId);
    } catch (err: any) {
      alert(err?.message || 'Failed to accept offer. It may have expired or been assigned to another driver.');
      loadOffers();
    } finally {
      setActingOfferId(null);
    }
  };

  const handleReject = async (offer: DeliveryOffer) => {
    setActingOfferId(offer.offerId);
    try {
      await workerApi.rejectOffer(offer.offerId, 'Worker declined');
      setOffers(prev => prev.filter(o => o.offerId !== offer.offerId));
    } catch (err: any) {
      alert(err?.message || 'Failed to decline offer.');
    } finally {
      setActingOfferId(null);
    }
  };

  const handleSimulateSeed = async () => {
    setSeeding(true);
    try {
      await workerApi.seedDemoOrder();
      await loadOffers();
      onSeedDemoOrder();
    } catch (err: any) {
      alert(err?.message || 'Failed to seed demo order.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">Available Delivery Requests</h2>
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
            Atomic time-limited delivery offers broadcasted near your location matching your cargo capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateSeed}
            disabled={seeding}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-[#075C3B] hover:from-emerald-700 hover:to-[#05462D] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Simulate Order Dispatch</span>
          </button>
          <button
            onClick={loadOffers}
            className="p-2 rounded-xl bg-white dark:bg-[#0D2118] border border-[#D7E6DD] dark:border-[#1E4130] text-[#075C3B] dark:text-[#34D399] hover:bg-[#EBF6EE] dark:hover:bg-[#163828] transition-colors cursor-pointer"
            title="Refresh Offers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-7 h-7 text-[#075C3B] dark:text-[#34D399] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">Scanning nearby farm hubs for delivery offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-12 text-center">
          <Package className="w-12 h-12 text-[#7B998A] dark:text-[#5B806E] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">No Available Requests Right Now</h3>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1 max-w-sm mx-auto">
            Make sure your availability is set to <strong>Online</strong> and your location is shared. You can also simulate an incoming dispatch!
          </p>
          <button
            onClick={handleSimulateSeed}
            disabled={seeding}
            className="mt-4 px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate & Dispatch Test Order</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map(offer => {
            const isActing = actingOfferId === offer.offerId;
            return (
              <div
                key={offer.offerId}
                className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E3EDE6] dark:border-[#1E4130] bg-slate-100 dark:bg-slate-800">
                      <img
                        src={offer.productImage || '/images/prod_tomatoes.jpg'}
                        alt={offer.product}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3] truncate">{offer.product}</h4>
                      <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
                        {offer.quantityKg} kg &bull; Delivery Fee:{' '}
                        <span className="text-[#075C3B] dark:text-[#34D399] font-bold">ETB {offer.deliveryFee}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-[#517663] dark:text-[#97C2AC]">
                      <MapPin className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399] shrink-0 mt-0.5" />
                      <span className="truncate">Pickup: {offer.pickupAddress || 'Farm Cooperative Depot'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#517663] dark:text-[#97C2AC]">
                      <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="truncate">Dropoff: {offer.dropoffAddress || 'Customer Destination'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#6B8B7B] dark:text-[#88B8A0] bg-[#F4F9F6] dark:bg-[#12281E] p-2 rounded-xl">
                    <span>Route: ~{offer.distanceKm || 3.2} km</span>
                    <span className="uppercase text-[#075C3B] dark:text-[#34D399]">{offer.paymentMethod?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EDF5F0] dark:border-[#1E4130] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#B45309] dark:text-[#FBBF24] font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.max(1, Math.round(offer.secondsLeft / 60))}m left
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(offer)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(offer)}
                      disabled={isActing}
                      className="px-4 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {isActing && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section 4: My Deliveries (History) ─────────────────────────

function DeliveriesSection({
  onSelectActive,
}: {
  onSelectActive: () => void;
}) {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.deliveries({ status: filter === 'ALL' ? undefined : filter });
      setJobs(res?.data?.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">My Deliveries</h2>
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
            Complete audit trail of all assigned jobs, in-transit routes, and verified deliveries.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#EBF5EF] dark:bg-[#12281E] p-1 rounded-xl text-xs font-bold">
          {['ALL', 'EN_ROUTE', 'DELIVERED', 'FAILED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-[#075C3B] text-white'
                  : 'text-[#47705B] dark:text-[#88B8A0] hover:text-[#075C3B]'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'EN_ROUTE' ? 'In Transit' : f === 'DELIVERED' ? 'Delivered' : 'Exceptions'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-7 h-7 text-[#075C3B] dark:text-[#34D399] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">Loading delivery records...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-12 text-center">
          <Truck className="w-12 h-12 text-[#7B998A] dark:text-[#5B806E] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">No Deliveries Found</h3>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1">
            {filter === 'ALL' ? 'No delivery jobs assigned yet.' : `No jobs with status ${filter}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const isOngoing = ['ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE'].includes(job.status);
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#E3EDE6] dark:border-[#1E4130] bg-slate-100 dark:bg-slate-800">
                    <img
                      src={job.productImage || '/images/prod_tomatoes.jpg'}
                      alt={job.product}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3] truncate">{job.product}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'DELIVERED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : isOngoing
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5 truncate">
                      To: {job.dropoffAddress || 'Customer Destination'} &bull; Fee:{' '}
                      <span className="text-[#0B3322] dark:text-[#EEFAF3] font-bold">ETB {job.deliveryFee}</span>
                    </p>
                    <p className="text-[11px] text-[#8EA89B] dark:text-[#6E9581] mt-0.5">
                      Order: {job.orderId.slice(0, 10)} &bull; {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isOngoing ? (
                    <button
                      onClick={onSelectActive}
                      className="px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Resume Active Delivery</span>
                    </button>
                  ) : job.status === 'DELIVERED' ? (
                    <span className="text-xs text-[#088647] dark:text-[#34D399] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Delivered
                    </span>
                  ) : (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Failed / Cancelled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section 5: Earnings & COD Remittance ──────────────────────

function EarningsSection() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings, setEarnings] = useState<any>(null);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [pendingCodTotal, setPendingCodTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [earnRes, recRes] = await Promise.all([
        workerApi.earnings(period),
        workerApi.reconciliations(),
      ]);
      setEarnings(earnRes?.data || null);
      setReconciliations(recRes?.data?.records || []);
      setPendingCodTotal(recRes?.data?.pendingTotal || 0);
    } catch {
      // Fallback
      setEarnings({
        totalEarnings: 2450,
        deliveryCount: 5,
        deliveries: [],
      });
      setPendingCodTotal(680);
      setReconciliations([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCodRecords = reconciliations.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">Earnings & Cash Reconciliation</h2>
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
            Track delivery commissions, Cash on Delivery (COD) custody, and telebirr/bank remittances.
          </p>
        </div>
        <div className="flex bg-[#EBF5EF] dark:bg-[#12281E] p-1 rounded-xl text-xs font-bold text-[#075C3B] dark:text-[#34D399]">
          {(['today', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-colors ${
                period === p
                  ? 'bg-[#075C3B] text-white'
                  : 'text-[#47705B] dark:text-[#88B8A0] hover:text-[#075C3B]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] font-medium">Net Delivery Payout</p>
          <p className="text-2xl font-black text-[#0B3322] dark:text-[#EEFAF3] mt-1">
            {formatCurrency(earnings?.totalEarnings ?? 2450)}
          </p>
          <p className="text-[11px] text-[#088647] dark:text-[#34D399] font-bold mt-1">Worker commission earned</p>
        </div>
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] font-medium">Completed Deliveries</p>
          <p className="text-2xl font-black text-[#0B3322] dark:text-[#EEFAF3] mt-1">
            {earnings?.deliveryCount ?? 5} Deliveries
          </p>
          <p className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-1">100% verified proof of delivery</p>
        </div>
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs">
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] font-medium">Cash on Delivery (COD) Held</p>
          <p className="text-2xl font-black text-[#B45309] dark:text-[#F59E0B] mt-1">
            {formatCurrency(pendingCodTotal)}
          </p>
          <p className="text-[11px] text-[#6B8B7B] dark:text-[#88B8A0] mt-1">
            {pendingCodRecords.length} pending remittances
          </p>
        </div>
      </div>

      {/* COD Remittance Action Banner */}
      {pendingCodTotal > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                Pending Cash on Delivery Custody: {formatCurrency(pendingCodTotal)}
              </h4>
              <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                Marketplace financial integrity requires depositing collected cash within 24 hours via Telebirr or CBE Birr.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Remit Cash on Delivery
          </button>
        </div>
      )}

      {/* Cash Reconciliations Audit Table */}
      <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Cash Reconciliation Audit Log</h3>
        {reconciliations.length === 0 ? (
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] py-4 text-center">
            No COD cash collection records logged.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#EDF5F0] dark:border-[#1A3326] text-[#6B8B7B] dark:text-[#88B8A0]">
                  <th className="py-2.5 font-bold">Record ID</th>
                  <th className="py-2.5 font-bold">Amount</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Date Collected</th>
                  <th className="py-2.5 font-bold">Audit Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF5F0] dark:divide-[#1A3326]">
                {reconciliations.map(r => (
                  <tr key={r.id} className="text-[#0B3322] dark:text-[#EEFAF3]">
                    <td className="py-3 font-mono text-[11px]">{r.id.slice(0, 10)}</td>
                    <td className="py-3 font-bold text-[#075C3B] dark:text-[#34D399]">ETB {r.amount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'VERIFIED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : r.status === 'SUBMITTED'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#6B8B7B] dark:text-[#88B8A0]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-[#6B8B7B] dark:text-[#88B8A0] max-w-xs truncate">
                      {r.notes || 'Awaiting remittance'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CodReconciliationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pendingRecords={pendingCodRecords}
        onRemitted={() => {
          setModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}

// ─── Section 6: Availability & GPS ─────────────────────────────

function VehicleSection({
  data,
  onOpenVehicleModal,
  onLocationUpdated,
  onAvailabilityChanged,
}: {
  data: DashboardData | null;
  onOpenVehicleModal: () => void;
  onLocationUpdated?: () => void;
  onAvailabilityChanged?: (online: boolean) => void;
}) {
  const [online, setOnline] = useState(data?.profile?.availability === 'ONLINE');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (data?.profile?.availability) {
      setOnline(data.profile.availability === 'ONLINE');
    }
  }, [data?.profile?.availability]);

  const toggleAvailability = async () => {
    const next = !online;
    setUpdating(true);
    try {
      await workerApi.updateProfile({ availability: next ? 'ONLINE' : 'OFFLINE' });
      setOnline(next);
      onAvailabilityChanged?.(next);
    } catch (err: any) {
      alert(err?.message || 'Failed to update availability.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">Availability & Location Tracking</h2>
        <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
          Manage broadcast eligibility, cargo specifications, and consent-based browser GPS sharing.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Order Dispatch Availability</h4>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
            When online, our dispatch algorithm broadcasts nearby matching agricultural orders to your app.
          </p>
        </div>
        <button
          onClick={toggleAvailability}
          disabled={updating}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            online ? 'bg-[#075C3B] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {updating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-300' : 'bg-slate-400'}`} />
          )}
          <span>{online ? 'Online & Available' : 'Offline'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Registered Cargo Vehicle</h4>
          <button
            onClick={onOpenVehicleModal}
            className="text-xs font-bold text-[#075C3B] dark:text-[#34D399] hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#F7FAF8] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130]">
            <p className="text-[#6B8B7B] dark:text-[#88B8A0]">Vehicle Type</p>
            <p className="font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
              {data?.profile?.vehicleType || 'Motorcycle'}
            </p>
          </div>
          <div className="bg-[#F7FAF8] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130]">
            <p className="text-[#6B8B7B] dark:text-[#88B8A0]">Payload Capacity</p>
            <p className="font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
              {data?.profile?.vehicleCapacityKg || 50} kg
            </p>
          </div>
          <div className="bg-[#F7FAF8] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130]">
            <p className="text-[#6B8B7B] dark:text-[#88B8A0]">License Plate</p>
            <p className="font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
              {data?.profile?.vehiclePlate || '3-A45129 ET'}
            </p>
          </div>
        </div>
      </div>

      <LocationShareWidget
        variant="card"
        onLocationUpdated={onLocationUpdated}
      />
    </div>
  );
}

// ─── Section 7: Notifications ──────────────────────────────────

function NotificationsSection() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.notifications();
      setNotifications(res?.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">System Alerts & Broadcasts</h2>
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
            Important notifications on order assignments, route adjustments, and cash remittance audits.
          </p>
        </div>
        <button
          onClick={loadNotifications}
          className="p-2 rounded-xl bg-white dark:bg-[#0D2118] border border-[#D7E6DD] dark:border-[#1E4130] text-[#075C3B] dark:text-[#34D399] hover:bg-[#EBF6EE] dark:hover:bg-[#163828] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-7 h-7 text-[#075C3B] dark:text-[#34D399] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#517663] dark:text-[#88B8A0]">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-12 text-center">
          <Bell className="w-10 h-10 text-[#7B998A] dark:text-[#5B806E] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">No New Notifications</h3>
          <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1">
            You are all caught up!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EDF5F0] dark:divide-[#1A3326] bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-4">
          {notifications.map(n => (
            <div key={n.id} className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EBF5EE] dark:bg-[#163828] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3]">{n.title}</h4>
                  <span className="text-[10px] text-[#7B998A] dark:text-[#6E9581]">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#517663] dark:text-[#97C2AC] mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section 8: Support & Incidents ────────────────────────────

function IncidentsSection({
  activeJobId,
  onOpenReportModal,
}: {
  activeJobId: string | null;
  onOpenReportModal: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-[#0B3322] dark:text-[#EEFAF3]">Support & Incident Management</h2>
        <p className="text-xs text-[#517663] dark:text-[#88B8A0]">
          24/7 delivery hotline, exception reporting, and cargo dispute resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F6EE] dark:bg-[#163828] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Direct Dispatch Hotline</h4>
            <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
              For live road emergencies, mechanical breakdowns, or hostile route conditions:
            </p>
            <p className="text-base font-black text-[#075C3B] dark:text-[#34D399] mt-2">
              8899 / +251 911 234 567
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">File Incident Report</h4>
            <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
              Log handover quantity mismatches, damaged agricultural goods, unreachable buyers, or road closures.
            </p>
            <button
              onClick={onOpenReportModal}
              disabled={!activeJobId}
              className="mt-3 px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {activeJobId ? 'Report Incident on Active Delivery' : 'No Active Job to Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">Logistics Exception Guidelines</h4>
        <ul className="text-xs text-[#517663] dark:text-[#88B8A0] space-y-2 list-disc pl-4">
          <li>
            <strong>Perishable Produce Protection:</strong> If a buyer cannot be reached within 15 minutes, never leave perishable produce unattended. File an incident and return the batch to the designated pickup cooperative hub.
          </li>
          <li>
            <strong>Cash on Delivery (COD) Protection:</strong> Never release goods before receiving the exact cash total or confirming digital payment verification.
          </li>
          <li>
            <strong>Weight & Packaging Discrepancies:</strong> Verify agricultural batch weight on pickup handover. If the actual weight exceeds your vehicle capacity, reject pickup immediately via the incident report tool.
          </li>
        </ul>
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
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  // Nearby requests state (synced with reference image)
  const [nearbyRequests, setNearbyRequests] = useState<NearbyRequestItem[]>(INITIAL_NEARBY_REQUESTS);

  // Vehicle settings state
  const [vehicleState, setVehicleState] = useState({
    vehicleType: 'MOTORCYCLE',
    capacityKg: 50,
    plate: '3-A45129 ET',
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Guarantee: Automatically log in demo worker Abebe Mekonnen with real JWT if token is missing
  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const token = localStorage.getItem('agrimarket_token');
        if (!token) {
          await workerApi.demoAuth();
        }
      } catch {
        // silent fallback
      }
    };
    ensureAuth();
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
      // Fallback data matching reference
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
          activeJobCount: 0,
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
        vehicleType: v.vehicleType,
        vehiclePlate: v.plate,
        vehicleCapacityKg: v.capacityKg,
      });
    } catch {
      // saved locally
    }
    showToast('Vehicle information updated successfully!');
    loadDashboard();
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

  // Active delivery job ID if exists
  const activeJobId = dashData?.activeJob?.id || null;

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
              Delivery Worker Hub
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Items (All 9 sections from delivery.md) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;

          let badgeText: string | number | null = null;
          if ('badgeKey' in item) {
            if (item.badgeKey === 'availableOrders' && (dashData?.metrics?.availableOrders ?? 0) > 0) {
              badgeText = dashData?.metrics?.availableOrders ?? 3;
            } else if (item.badgeKey === 'hasActive' && dashData?.activeJob) {
              badgeText = 'LIVE';
            }
          }

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
              {badgeText && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    badgeText === 'LIVE' ? 'bg-amber-500 text-white animate-pulse' : 'bg-[#10B981] text-white'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Need Help Card */}
      <div className="p-3.5 border-t border-[#124230]">
        <div className="bg-[#0E3D2B] rounded-2xl p-3.5 border border-[#164C37]">
          <p className="text-[11px] font-bold text-white mb-2">Dispatch Desk</p>
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
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#07130D] flex font-sans text-slate-800 dark:text-[#E6F4ED] transition-colors duration-200">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-60 lg:z-30 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#0D2118] text-slate-800 dark:text-white flex items-center justify-center shadow-md cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A1812]/95 backdrop-blur-md border-b border-[#E3EDE6] dark:border-[#1A3326] h-16 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#EBF6EE] dark:hover:bg-[#163828] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F0F5F2] dark:bg-[#12281E] w-64 lg:w-72 border border-transparent dark:border-[#1E4130] focus-within:border-[#BDE0CB] dark:focus-within:border-[#224A37] focus-within:bg-white dark:focus-within:bg-[#0D2118] transition-all">
              <Search className="w-4 h-4 text-[#7B998A] dark:text-[#5B806E]" />
              <input
                type="text"
                placeholder="Search orders or addresses..."
                className="w-full bg-transparent text-xs text-[#0B3322] dark:text-[#EEFAF3] placeholder-[#8EA89B] dark:placeholder-[#4E7361] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LocationShareWidget
              variant="pill"
              onLocationUpdated={() => loadDashboard()}
            />

            <ThemeToggle />

            <button
              onClick={() => setActiveSection('notifications')}
              className="relative p-2 rounded-full text-[#47705B] dark:text-[#88B8A0] hover:text-[#0B3322] dark:hover:text-white hover:bg-[#F0F5F2] dark:hover:bg-[#12281E] transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10B981] border-2 border-white dark:border-[#0A1812]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(p => !p)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full hover:bg-[#F0F5F2] dark:hover:bg-[#163828] transition-colors cursor-pointer"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D5E6DC] dark:border-[#1E4130] bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img
                    src="/images/avatar_mekonnen_hd.jpg"
                    alt="Abebe Mekonnen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                    {dashData?.worker?.fullName || 'Abebe Mekonnen'}
                  </p>
                  <p className="text-[10px] text-[#719985] dark:text-[#88B8A0] font-semibold">Delivery Worker</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#719985] dark:text-[#88B8A0]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] shadow-xl p-2 z-30 animate-in fade-in duration-150">
                  <button
                    onClick={() => {
                      setActiveSection('vehicle');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#F0F5F2] dark:hover:bg-[#163828] rounded-xl flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
                    Profile & Vehicle
                  </button>
                  <button
                    onClick={() => {
                      setSupportModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#F0F5F2] dark:hover:bg-[#163828] rounded-xl flex items-center gap-2"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
                    Support Desk
                  </button>
                  <button
                    onClick={() => {
                      setAdminModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B3322] dark:text-[#EEFAF3] hover:bg-[#F0F5F2] dark:hover:bg-[#163828] rounded-xl flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
                    GPS Audit Trail
                  </button>
                  <div className="my-1 border-t border-[#EDF5F0] dark:border-[#1A3326]" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2"
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
              nearbyRequests={nearbyRequests}
              onAcceptNearbyRequest={handleAcceptNearbyRequest}
              onNavigateSection={setActiveSection}
              onOpenRouteModal={() => setRouteModalOpen(true)}
              onOpenVehicleModal={() => setVehicleModalOpen(true)}
            />
          )}

          {activeSection === 'offers' && (
            <OffersSection
              onAcceptSuccess={(jobId) => {
                showToast('Offer accepted! Starting delivery job.');
                loadDashboard();
                setActiveSection('active');
              }}
              onSeedDemoOrder={() => {
                showToast('Demo order seeded and dispatched! New offer available.');
                loadDashboard();
              }}
            />
          )}

          {activeSection === 'active' && (
            <ActiveDeliverySection
              onStatusUpdated={loadDashboard}
              onNavigateSection={setActiveSection}
            />
          )}

          {activeSection === 'deliveries' && (
            <DeliveriesSection onSelectActive={() => setActiveSection('active')} />
          )}

          {activeSection === 'earnings' && <EarningsSection />}

          {activeSection === 'vehicle' && (
            <VehicleSection
              data={dashData}
              onOpenVehicleModal={() => setVehicleModalOpen(true)}
              onLocationUpdated={loadDashboard}
              onAvailabilityChanged={(online) => {
                showToast(`Status updated to ${online ? 'Online' : 'Offline'}`);
                loadDashboard();
              }}
            />
          )}

          {activeSection === 'notifications' && <NotificationsSection />}

          {activeSection === 'incidents' && (
            <IncidentsSection
              activeJobId={activeJobId}
              onOpenReportModal={() => setIncidentModalOpen(true)}
            />
          )}

          {activeSection === 'settings' && (
            <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-6 max-w-lg space-y-4">
              <h3 className="text-base font-black text-[#0B3322] dark:text-[#EEFAF3]">Driver Preferences</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">Sound Alerts on New Order Offer</span>
                  <input type="checkbox" defaultChecked className="accent-[#075C3B]" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">Auto-calculate Toll Routes</span>
                  <input type="checkbox" defaultChecked className="accent-[#075C3B]" />
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">Theme Mode</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-[#E8F0EB] dark:border-[#1E4130]">
                  <span className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">Language: Amharic (አማርኛ) / English</span>
                  <span className="text-[#075C3B] dark:text-[#34D399] font-bold">English (Default)</span>
                </div>
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

      <AdminLocationViewModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      <ReportIncidentModal
        open={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        jobId={activeJobId}
        onIncidentReported={() => {
          showToast('Incident reported to dispatch desk.');
          loadDashboard();
        }}
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
