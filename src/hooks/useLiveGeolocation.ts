import { useState, useEffect } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export function useLiveGeolocation(defaultLat = 13.0642, defaultLng = 80.2811) {
  const [coords, setCoords] = useState<LocationCoords>({
    lat: defaultLat,
    lng: defaultLng,
    accuracy: null,
    heading: null,
    speed: null,
  });
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Browser does not support native Geolocation');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      });
      setIsLiveGps(true);
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message || 'GPS location unavailable');
      setIsLiveGps(false);
    };

    // Obtain immediate current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    });

    // Stream live location changes
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [defaultLat, defaultLng]);

  return { coords, isLiveGps, error };
}

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
