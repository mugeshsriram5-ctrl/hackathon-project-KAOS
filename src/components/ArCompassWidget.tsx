import React, { useState, useEffect } from 'react';
import { MasterSpot } from '../types';
import { KAOS_SPOTS } from '../data/kaosData';

interface ArCompassWidgetProps {
  onSpotSelected: (spot: MasterSpot) => void;
  onShowToast: (msg: string) => void;
}

export const ArCompassWidget: React.FC<ArCompassWidgetProps> = ({
  onSpotSelected,
  onShowToast,
}) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Nearby featured heritage spots for the compass
  const featuredSpots = KAOS_SPOTS.slice(0, 6);

  const requestOrientationPermission = async () => {
    try {
      if (
        typeof (DeviceOrientationEvent as any) !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          onShowToast('AR Compass sensor access granted! 🧭');
        } else {
          onShowToast('Device orientation permission denied.');
        }
      } else {
        setPermissionGranted(true);
        onShowToast('AR Compass active.');
      }
    } catch (err: any) {
      console.warn('Device orientation permission error:', err);
      setPermissionGranted(true);
    }
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let compass = event.alpha;
      if (typeof compass === 'number') {
        const webkitHeading = (event as any).webkitCompassHeading;
        if (typeof webkitHeading === 'number') {
          compass = webkitHeading;
        }
        setHeading(Math.round(compass));
      }
    };

    if (permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permissionGranted]);

  const getCardinalDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F05423]">explore</span>
          <div>
            <h3 className="text-sm font-bold text-white">AR Heritage Radar Compass</h3>
            <p className="text-[11px] text-zinc-400">Point your device to discover surrounding historical beacons</p>
          </div>
        </div>

        {!permissionGranted ? (
          <button
            onClick={requestOrientationPermission}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-95 transition-all"
          >
            Enable AR Sensor
          </button>
        ) : (
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{heading !== null ? `${heading}° ${getCardinalDirection(heading)}` : 'Calibrating...'}</span>
          </div>
        )}
      </div>

      {/* Simulated / Live AR Compass Ring */}
      <div className="relative h-44 w-full bg-[#121114] border border-[#26242C] rounded-2xl flex items-center justify-center overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border border-[#26242C]" />
        <div className="absolute w-20 h-20 rounded-full border border-[#26242C]" />
        <div className="absolute w-full h-[1px] bg-[#26242C]" />
        <div className="absolute h-full w-[1px] bg-[#26242C]" />

        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
          style={{ transform: `rotate(${heading || 0}deg)` }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-3 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-[#F05423]">N</span>
              <span className="w-1 h-3 bg-[#F05423] rounded-full" />
            </div>
            <div className="absolute bottom-3 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-zinc-500">S</span>
              <span className="w-1 h-3 bg-zinc-600 rounded-full" />
            </div>
          </div>
        </div>

        <div className="z-10 bg-black/80 backdrop-blur-md border border-[#F05423]/50 px-4 py-2 rounded-2xl text-center shadow-lg">
          <p className="text-[10px] font-mono text-[#F05423] uppercase">Heading Vector</p>
          <p className="text-sm font-bold text-white">{heading !== null ? `${heading}°` : '360° Panorama'}</p>
        </div>
      </div>

      {/* Nearby Spots Bearings List */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Nearest Beacons in Line of Sight</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {featuredSpots.map((spot, idx) => (
            <button
              key={spot.id}
              onClick={() => onSpotSelected(spot)}
              className="p-3 bg-[#121114] hover:bg-[#26242C]/60 border border-[#26242C] hover:border-[#F05423]/50 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#1C1A1F] text-[#F05423] flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                {(idx + 1) * 45}°
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{spot.title}</p>
                <p className="text-[10px] text-zinc-400 truncate">{spot.zone} Sector</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
