'use client';

import { useState, useCallback, useRef } from 'react';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeolocationErrorState {
  code: string;
  message: string;
  userFriendlyMessage: string;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(defaultOptions: UseGeolocationOptions = {}) {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationErrorState | null>(null);

  // Store options in ref to avoid recreating callbacks
  const optionsRef = useRef<UseGeolocationOptions>(defaultOptions);
  optionsRef.current = defaultOptions;

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  /**
   * Triggers the native browser Geolocation API ONLY upon user request.
   * Never runs automatically on page load or silently in the background.
   */
  const requestLocation = useCallback(
    (overrideOptions: UseGeolocationOptions = {}): Promise<GeolocationCoordinates> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          const err: GeolocationErrorState = {
            code: 'NOT_SUPPORTED',
            message: 'Geolocation is not supported by this browser.',
            userFriendlyMessage:
              'Your web browser does not support the Geolocation API. Please try using Chrome, Edge, Safari, or Firefox.',
          };
          setStatus('unsupported');
          setError(err);
          return reject(err);
        }

        setStatus('requesting');
        setError(null);

        const mergedOptions: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          ...optionsRef.current,
          ...overrideOptions,
        };

        navigator.geolocation.getCurrentPosition(
          (pos: GeolocationPosition) => {
            const coords: GeolocationCoordinates = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
            };

            setCoordinates(coords);
            setStatus('success');
            setError(null);
            resolve(coords);
          },
          (geoErr: GeolocationPositionError) => {
            let statusCode: GeolocationStatus = 'unavailable';
            let userFriendly = 'An unknown error occurred while retrieving your GPS position.';

            switch (geoErr.code) {
              case geoErr.PERMISSION_DENIED:
                statusCode = 'denied';
                userFriendly =
                  'Location permission was denied. To enable it, click the lock / permissions icon in your browser address bar and select "Allow" for Location.';
                break;
              case geoErr.POSITION_UNAVAILABLE:
                statusCode = 'unavailable';
                userFriendly =
                  'GPS location information is currently unavailable. Please verify that device location/GPS is switched on.';
                break;
              case geoErr.TIMEOUT:
                statusCode = 'timeout';
                userFriendly =
                  'Location request timed out while waiting for a GPS satellite fix. Please retry.';
                break;
            }

            const errState: GeolocationErrorState = {
              code: statusCode.toUpperCase(),
              message: geoErr.message,
              userFriendlyMessage: userFriendly,
            };

            setStatus(statusCode);
            setError(errState);
            reject(errState);
          },
          mergedOptions
        );
      });
    },
    [isSupported]
  );

  const clear = useCallback(() => {
    setStatus('idle');
    setCoordinates(null);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    return requestLocation();
  }, [requestLocation]);

  return {
    status,
    coordinates,
    error,
    isSupported,
    isLoading: status === 'requesting',
    isSuccess: status === 'success',
    isDenied: status === 'denied',
    requestLocation,
    clear,
    retry,
  };
}
