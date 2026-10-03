import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterSpot } from '../types';
import { KAOS_SPOTS } from '../data/kaosData';
import { KaosAppIcon } from './KaosAppIcon';

interface ArDiscoveryOverlayProps {
  onClose: () => void;
  onSpotSelected: (spot: MasterSpot) => void;
}

// Utility functions for spatial synchronization
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const λ1 = lon1 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export const ArDiscoveryOverlay: React.FC<ArDiscoveryOverlayProps> = ({
  onClose,
  onSpotSelected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [nearestSpot, setNearestSpot] = useState<{ spot: MasterSpot; distance: number; bearing: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Camera access denied. Archaeological vision offline.');
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Track Geolocation
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Location sync failed. Beacons lost.');
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 3. Track Device Orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let compass = (event as any).webkitCompassHeading || event.alpha;
      if (typeof compass === 'number') {
        setHeading(compass);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // 4. Calculate Nearest Spot
  useEffect(() => {
    if (!userLocation) return;

    let minDistance = Infinity;
    let closest: MasterSpot | null = null;
    let closestBearing = 0;

    KAOS_SPOTS.forEach((spot) => {
      if (spot.lat === undefined || spot.lng === undefined) return;

      const d = getDistance(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
      if (d < minDistance) {
        minDistance = d;
        closest = spot;
        closestBearing = getBearing(userLocation.lat, userLocation.lng, spot.lat, spot.lng);
      }
    });

    if (closest) {
      setNearestSpot({
        spot: closest,
        distance: minDistance,
        bearing: closestBearing,
      });
    }
  }, [userLocation]);

  const relativeBearing = heading !== null && nearestSpot 
    ? (nearestSpot.bearing - heading + 360) % 360 
    : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Camera Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.5] contrast-[1.2]"
      />

      {/* AR HUD Overlay */}
      <div className="relative flex-1 flex flex-col pointer-events-none">
        {/* Top Header */}
        <div className="p-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <KaosAppIcon size={38} />
            <div>
              <h2 className="text-white font-black uppercase tracking-tighter text-lg italic">KAOS AR <span className="text-kaos-pink">VISION</span></h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Archaeological Radar Synchronization</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Center Target / Radar */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Scanning Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(240,84,35,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
          
          {/* Target Reticle */}
          <div className="relative w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center">
            <div className="absolute inset-[-10px] border border-dashed border-[#F05423]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
            
            {/* Directional Navigation Arrow */}
            {nearestSpot && (
              <motion.div
                animate={{ rotate: relativeBearing }}
                className="absolute inset-0 flex items-start justify-center p-4 transition-transform duration-150"
              >
                <div className="w-1 h-8 bg-gradient-to-t from-transparent to-[#F05423] rounded-full shadow-[0_0_10px_#F05423]"></div>
              </motion.div>
            )}

            <AnimatePresence>
              {nearestSpot && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: Math.sin(relativeBearing * Math.PI / 180) * 120,
                    y: -Math.cos(relativeBearing * Math.PI / 180) * 120,
                  }}
                  className="absolute pointer-events-auto cursor-pointer"
                  onClick={() => onSpotSelected(nearestSpot.spot)}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#F05423] shadow-[0_0_15px_#F05423] flex items-center justify-center border-2 border-white">
                      <span className="material-symbols-outlined text-white text-sm">location_on</span>
                    </div>
                    <div className="mt-2 bg-black/80 backdrop-blur-md border border-[#F05423]/50 px-3 py-1 rounded-full whitespace-nowrap">
                      <p className="text-[10px] font-black text-white uppercase">{nearestSpot.spot.title}</p>
                      <p className="text-[9px] text-[#F05423] font-bold text-center">{Math.round(nearestSpot.distance)}m</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>
          </div>
        </div>

        {/* Bottom Data HUD */}
        <div className="p-6 space-y-4">
          {nearestSpot ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-[#F05423] uppercase tracking-widest">Nearest Heritage Beacon</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Link Established
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F05423] to-[#FF8A00] flex items-center justify-center text-2xl shadow-lg">
                  <span className="material-symbols-outlined text-white">explore</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate">{nearestSpot.spot.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[#F05423] font-mono text-xs font-bold">{Math.round(nearestSpot.distance)}m Away</p>
                    <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                    <p className="text-zinc-400 font-mono text-xs font-bold">{Math.round(nearestSpot.bearing)}° Vector</p>
                  </div>
                </div>
                <button
                  onClick={() => onSpotSelected(nearestSpot.spot)}
                  className="w-10 h-10 rounded-full bg-[#F05423] text-white flex items-center justify-center shadow-lg"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Searching for archaeological frequencies...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-sm">error</span>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest leading-tight">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
