'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { LocationConsentModal } from './LocationConsentModal';
import { locationApi, LatestLocationResponse } from '@/lib/locationApi';
import { GeolocationCoordinates } from '@/hooks/useGeolocation';

interface LocationShareWidgetProps {
  variant?: 'pill' | 'card';
  className?: string;
  onLocationUpdated?: (coords: GeolocationCoordinates) => void;
}

export function LocationShareWidget({
  variant = 'pill',
  className = '',
  onLocationUpdated,
}: LocationShareWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    capturedAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchActive = async () => {
    try {
      const res = await locationApi.getMyLatest();
      if (res?.data?.deliveryProfileLocation?.lastLatitude && res?.data?.deliveryProfileLocation?.lastLongitude) {
        setActiveLocation({
          latitude: res.data.deliveryProfileLocation.lastLatitude,
          longitude: res.data.deliveryProfileLocation.lastLongitude,
          accuracy: res.data.deliveryProfileLocation.lastAccuracy,
          capturedAt: res.data.deliveryProfileLocation.lastLocationAt,
        });
      } else if (res?.data?.latestRecord) {
        setActiveLocation({
          latitude: res.data.latestRecord.latitude,
          longitude: res.data.latestRecord.longitude,
          accuracy: res.data.latestRecord.accuracy,
          capturedAt: res.data.latestRecord.capturedAt,
        });
      } else {
        // Check local storage fallback for demo mode
        const local = localStorage.getItem('agrimarket_worker_location');
        if (local) {
          try {
            setActiveLocation(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      const local = localStorage.getItem('agrimarket_worker_location');
      if (local) {
        try {
          setActiveLocation(JSON.parse(local));
        } catch {
          // ignore
        }
      }
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const handleLocationShared = (coords: GeolocationCoordinates) => {
    const loc = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      capturedAt: new Date().toISOString(),
    };
    setActiveLocation(loc);
    try {
      localStorage.setItem('agrimarket_worker_location', JSON.stringify(loc));
    } catch {
      // ignore
    }
    if (onLocationUpdated) {
      onLocationUpdated(coords);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke your shared location and clear active GPS records?')) {
      return;
    }
    setRevoking(true);
    try {
      await locationApi.revokeHistory();
      setActiveLocation(null);
      localStorage.removeItem('agrimarket_worker_location');
      setToast('Location consent revoked. Position cleared.');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setActiveLocation(null);
      localStorage.removeItem('agrimarket_worker_location');
      setToast('Location cleared locally.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRevoking(false);
    }
  };

  // Compact Pill mode (Ideal for headers)
  if (variant === 'pill') {
    return (
      <>
        {activeLocation ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-emerald-50 dark:bg-[#122E21] text-[#075C3B] dark:text-[#34D399] border border-emerald-200 dark:border-[#1E4130] hover:bg-emerald-100 dark:hover:bg-[#173A2A] shadow-xs ${className}`}
            title={`GPS Active: ${activeLocation.latitude.toFixed(4)}, ${activeLocation.longitude.toFixed(4)}${
              activeLocation.accuracy ? ` (±${activeLocation.accuracy}m)` : ''
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="truncate max-w-[120px] sm:max-w-none">
              GPS Active
              {activeLocation.accuracy ? ` (±${activeLocation.accuracy}m)` : ''}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-[#F0F5F2] dark:bg-[#12281E] text-[#47705B] dark:text-[#88B8A0] border border-[#D5E5DC] dark:border-[#1E4130] hover:border-[#075C3B] hover:text-[#075C3B] dark:hover:text-white shadow-xs ${className}`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#075C3B] dark:text-[#34D399]" />
            <span>Share GPS</span>
          </button>
        )}

        <LocationConsentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onLocationShared={handleLocationShared}
        />
      </>
    );
  }

  // Full Card mode (Ideal for Vehicle & Profile Settings)
  return (
    <>
      <div className={`bg-white dark:bg-[#0D2118] rounded-2xl border border-[#E3EDE6] dark:border-[#1E4130] p-5 shadow-xs space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E7F7ED] dark:bg-[#163828] text-[#075C3B] dark:text-[#34D399] flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                GPS Location & Privacy Controls
              </h4>
              <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0]">
                Native browser Geolocation API with explicit consent verification.
              </p>
            </div>
          </div>

          {activeLocation && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#088647] dark:text-[#34D399] bg-[#E8F8EE] dark:bg-[#133A27] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          )}
        </div>

        {activeLocation ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#F8FAF9] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130]">
                <p className="text-[#6B8B7B] dark:text-[#88B8A0]">Latitude</p>
                <p className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
                  {activeLocation.latitude.toFixed(4)}° N
                </p>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130]">
                <p className="text-[#6B8B7B] dark:text-[#88B8A0]">Longitude</p>
                <p className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3] mt-0.5">
                  {activeLocation.longitude.toFixed(4)}° E
                </p>
              </div>
              <div className="bg-[#F8FAF9] dark:bg-[#12281E] p-3 rounded-xl border border-[#E8F0EB] dark:border-[#1E4130] col-span-2 sm:col-span-1">
                <p className="text-[#6B8B7B] dark:text-[#88B8A0]">Reported Accuracy</p>
                <p className="font-bold text-[#075C3B] dark:text-[#34D399] mt-0.5">
                  {activeLocation.accuracy ? `± ${activeLocation.accuracy} meters` : 'Standard GPS fix'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EDF5F0] dark:border-[#1A3326]">
              <div className="flex items-center gap-1.5 text-xs text-[#517663] dark:text-[#97C2AC]">
                <ShieldCheck className="w-4 h-4 text-[#075C3B] dark:text-[#34D399]" />
                <span>Consent verified. Never tracked in background.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Update GPS</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#F8FAF9] dark:bg-[#12281E] border border-dashed border-[#CCDED3] dark:border-[#1E4130] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                No active location shared yet.
              </p>
              <p className="text-[#6B8B7B] dark:text-[#88B8A0] mt-0.5">
                Share your device coordinates to receive nearby order dispatch offers matching your route.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Share My Location</span>
            </button>
          </div>
        )}

        {toast && (
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl text-center">
            {toast}
          </p>
        )}
      </div>

      <LocationConsentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLocationShared={handleLocationShared}
      />
    </>
  );
}
