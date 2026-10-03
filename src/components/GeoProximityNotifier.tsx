import React, { useState } from 'react';
import { KAOS_SPOTS } from '../data/kaosData';
import { MasterSpot } from '../types';

interface GeoProximityNotifierProps {
  onSpotSelected: (spot: MasterSpot) => void;
  onShowToast: (msg: string) => void;
}

export const GeoProximityNotifier: React.FC<GeoProximityNotifierProps> = ({
  onSpotSelected,
  onShowToast,
}) => {
  const [trackingActive, setTrackingActive] = useState(false);
  const [nearbyAlert, setNearbyAlert] = useState<{ spot: MasterSpot; distanceMeters: number } | null>(null);
  const [dismissedSpotIds, setDismissedSpotIds] = useState<string[]>([]);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      onShowToast('Geolocation is not supported by your browser.');
      return;
    }

    setTrackingActive(true);
    onShowToast('GPS Proximity Tracking Active! Scanning Chennai heritage beacons...');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let closest: MasterSpot | null = null;
        let minDistance = Infinity;

        KAOS_SPOTS.forEach((spot) => {
          if (typeof spot.lat !== 'number' || typeof spot.lng !== 'number') return;
          const R = 6371e3; // metres
          const φ1 = (userLat * Math.PI) / 180;
          const φ2 = (spot.lat * Math.PI) / 180;
          const Δφ = ((spot.lat - userLat) * Math.PI) / 180;
          const Δλ = ((spot.lng - userLng) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance < minDistance) {
            minDistance = distance;
            closest = spot;
          }
        });

        if (closest && minDistance <= 800) {
          const spot = closest as MasterSpot;
          if (!dismissedSpotIds.includes(spot.id)) {
            setNearbyAlert({ spot, distanceMeters: Math.round(minDistance) });
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`🏛️ Heritage Proximity Nudge`, {
                body: `You are only ${Math.round(minDistance)}m away from ${spot.title}! Tap to explore.`,
                icon: spot.imageUrl,
              });
            }
          }
        }
      },
      (error) => {
        console.warn('Geolocation watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  return (
    <>
      {!trackingActive ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-lg">near_me</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Background Proximity Radar</h4>
            </div>
            <p className="text-[11px] text-zinc-400">Get gentle local notification nudges when walking near Chennai heritage monuments.</p>
          </div>
          <button
            onClick={startTracking}
            className="px-4 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-lg shadow-[#F05423]/25"
          >
            Enable Radar
          </button>
        </div>
      ) : (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-bold font-mono">Proximity Radar Active (Scanning GPS)</span>
          </div>
          <span className="text-[10px] text-zinc-400">Auto-nudging enabled</span>
        </div>
      )}

      {/* Proximity Nudge Banner Popup */}
      {nearbyAlert && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm bg-[#1C1A1F] border border-[#F05423] rounded-3xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <img
              src={nearbyAlert.spot.imageUrl}
              alt={nearbyAlert.spot.title}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-[#26242C]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#F05423] font-bold uppercase">Proximity Nudge</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {nearbyAlert.distanceMeters}m away
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate mt-0.5">{nearbyAlert.spot.title}</h4>
              <p className="text-[11px] text-zinc-400 truncate">{nearbyAlert.spot.zone} Sector</p>
            </div>
            <button
              onClick={() => {
                setDismissedSpotIds((prev) => [...prev, nearbyAlert.spot.id]);
                setNearbyAlert(null);
              }}
              className="text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                onSpotSelected(nearbyAlert.spot);
                setNearbyAlert(null);
              }}
              className="w-full py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Open Beacon Details
            </button>
          </div>
        </div>
      )}
    </>
  );
};
