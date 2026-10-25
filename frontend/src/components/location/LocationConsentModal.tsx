'use client';

import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Compass,
  Radio,
  Lock,
} from 'lucide-react';
import { useGeolocation, GeolocationCoordinates } from '@/hooks/useGeolocation';
import { locationApi } from '@/lib/locationApi';

interface LocationConsentModalProps {
  open: boolean;
  onClose: () => void;
  purpose?: string;
  onLocationShared?: (coords: GeolocationCoordinates) => void;
}

export function LocationConsentModal({
  open,
  onClose,
  purpose = 'DELIVERY_DISPATCH',
  onLocationShared,
}: LocationConsentModalProps) {
  const { status, coordinates, error, requestLocation, retry, clear } = useGeolocation();
  const [savingToServer, setSavingToServer] = useState(false);
  const [serverSuccess, setServerSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!open) return null;

  const handleShareClick = async () => {
    setServerError(null);
    setServerSuccess(false);

    try {
      // 1. Trigger native browser prompt explicitly on user click
      const coords = await requestLocation();

      // 2. Transmit consented coordinates to authenticated backend endpoint
      setSavingToServer(true);
      await locationApi.shareLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed,
        consentGranted: true,
        consentPurpose: purpose,
        consentVersion: '1.0',
      });

      setServerSuccess(true);
      if (onLocationShared) {
        onLocationShared(coords);
      }
    } catch (err: any) {
      if (err?.code === 'PERMISSION_DENIED' || err?.code === 'DENIED') {
        // Geolocation hook handles permission denial
      } else {
        setServerError(err?.message || 'Failed to sync location with server.');
      }
    } finally {
      setSavingToServer(false);
    }
  };

  const handleClose = () => {
    clear();
    setServerSuccess(false);
    setServerError(null);
    onClose();
  };

  const isRequesting = status === 'requesting' || savingToServer;
  const isDone = (status === 'success' && serverSuccess) || (status === 'success' && !savingToServer);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#0D2118] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E3EDE6] dark:border-[#1E4130] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#075C3B] to-[#0A3D28] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 id="location-modal-title" className="text-base font-black tracking-tight text-white">
                Share Live GPS Location
              </h3>
              <p className="text-[11px] text-emerald-200">Consent-Based Location Services</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Status 1: Initial Prompt / Why we ask */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#EBF7F0] dark:bg-[#122E21] border border-[#CCE8D7] dark:border-[#1E4130] flex items-start gap-3">
                <Radio className="w-5 h-5 text-[#075C3B] dark:text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#075C3B] dark:text-[#34D399]">Why your location is requested:</p>
                  <p className="text-[#3F6652] dark:text-[#88B8A0] mt-0.5">
                    We use your device GPS to broadcast new orders within your vehicle delivery radius, calculate accurate route distances, and provide live delivery ETA to buyers and farm hubs.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-[#2B4B39] dark:text-[#CBE6D7]">
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-[#075C3B] dark:text-[#34D399] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#0B3322] dark:text-[#EEFAF3]">Find nearby order offers:</strong> Only see deliveries you can fulfill quickly.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#075C3B] dark:text-[#34D399] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#0B3322] dark:text-[#EEFAF3]">Consent-based & private:</strong> Location is only shared when you tap this button. We never track in background or sell data.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#075C3B] dark:text-[#34D399] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#0B3322] dark:text-[#EEFAF3]">Revocable anytime:</strong> You can clear or revoke your location records in Driver Settings.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status 2: Requesting Position */}
          {isRequesting && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-[#075C3B] text-white flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                  Acquiring Device GPS Signal...
                </p>
                <p className="text-xs text-[#6B8B7B] dark:text-[#88B8A0] mt-1 max-w-xs mx-auto">
                  {status === 'requesting'
                    ? 'Please accept the browser location prompt if prompted.'
                    : 'Syncing verified coordinates with server...'}
                </p>
              </div>
            </div>
          )}

          {/* Status 3: Success State */}
          {isDone && coordinates && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-[#E8F8EE] dark:bg-[#133A27] border border-[#BDE0CB] dark:border-[#224A37] text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#075C3B] dark:text-[#34D399] mx-auto" />
                <h4 className="text-sm font-black text-[#0B3322] dark:text-[#EEFAF3]">
                  Location Consented & Updated!
                </h4>
                <p className="text-xs text-[#4F7360] dark:text-[#A7D1BD]">
                  Your current coordinates are active for dispatch and nearby orders.
                </p>
              </div>

              {/* Coordinate Details Card */}
              <div className="bg-[#F8FAF9] dark:bg-[#12281E] p-3.5 rounded-2xl border border-[#E6EFE9] dark:border-[#1E4130] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B8B7B] dark:text-[#88B8A0]">Latitude:</span>
                  <span className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                    {coordinates.latitude}° N
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B8B7B] dark:text-[#88B8A0]">Longitude:</span>
                  <span className="font-mono font-bold text-[#0B3322] dark:text-[#EEFAF3]">
                    {coordinates.longitude}° E
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B8B7B] dark:text-[#88B8A0]">Reported Accuracy:</span>
                  <span className="font-bold text-[#075C3B] dark:text-[#34D399] bg-[#EBF6EE] dark:bg-[#173E2B] px-2 py-0.5 rounded-md">
                    &plusmn; {coordinates.accuracy} meters
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7B998A] dark:text-[#6E9581] pt-1 border-t border-[#EDF5F0] dark:border-[#1A3326]">
                  <span>Purpose:</span>
                  <span className="font-semibold uppercase">{purpose}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status 4: Permission Denied */}
          {status === 'denied' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Browser Location Access Denied</span>
                </div>
                <p>
                  You or your browser blocked location access for this site. AgriMarket cannot retrieve your position without your explicit permission.
                </p>
                <div className="bg-white/80 dark:bg-black/30 p-2.5 rounded-xl space-y-1 font-medium">
                  <p className="font-bold">How to enable location permissions:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                    <li>Click the <strong>Lock / Settings icon (🔒)</strong> on the left side of your browser URL address bar.</li>
                    <li>Find <strong>Location</strong> and switch it to <strong>Allow</strong>.</li>
                    <li>Click the <strong>Retry</strong> button below or reload the page.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Status 5: Position Unavailable / Timeout */}
          {(status === 'unavailable' || status === 'timeout') && (
            <div className="space-y-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>GPS Signal Not Found</span>
              </div>
              <p>{error?.userFriendlyMessage || 'Unable to retrieve device GPS signal.'}</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Ensure device GPS / Location toggles are turned on in your device settings.
              </p>
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
              {serverError}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E3EDE6] dark:border-[#1E4130] flex gap-2.5 bg-slate-50 dark:bg-[#0A1812]">
          {isDone ? (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done &bull; Continue
            </button>
          ) : status === 'denied' || status === 'unavailable' || status === 'timeout' ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] dark:border-[#1E4130] text-xs font-bold text-[#375747] dark:text-[#88B8A0] hover:bg-white dark:hover:bg-[#12281E] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={retry}
                className="flex-1 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry GPS
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isRequesting}
                className="flex-1 py-2.5 rounded-xl border border-[#D5E2DA] dark:border-[#1E4130] text-xs font-bold text-[#375747] dark:text-[#88B8A0] hover:bg-white dark:hover:bg-[#12281E] transition-colors cursor-pointer disabled:opacity-50"
              >
                Not Now
              </button>
              <button
                onClick={handleShareClick}
                disabled={isRequesting}
                className="flex-1 py-2.5 rounded-xl bg-[#075C3B] hover:bg-[#05462D] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-60"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isRequesting ? 'Sharing...' : 'Share My Location'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
