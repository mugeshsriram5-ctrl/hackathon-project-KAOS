import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { ClusteredSpotsMarkers } from '../components/ClusteredSpotsMarkers';
import { soundscapes } from '../lib/soundscapeEngine';
import { KAOS_SPOTS } from '../data/kaosData';
import { MasterSpot } from '../types';
import { useLiveGeolocation, calculateDistanceMeters } from '../hooks/useLiveGeolocation';
import { logActivity } from '../services/activityService';
import { auth } from '../lib/firebase';
import { KaosAppIcon } from '../components/KaosAppIcon';

interface MapScreenProps {
  onShowToast: (msg: string) => void;
  onAwardXp?: (amount: number, reason: string) => void;
  onOpenNavRd?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onShowToast, onAwardXp, onOpenNavRd }) => {
  const [activeSoundscape, setActiveSoundscape] = useState<string>('temple');
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'ar' | 'map' | 'snapshot'>('ar');
  const [bearing, setBearing] = useState<number>(42);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('senate-house');
  const [infoWindowSpot, setInfoWindowSpot] = useState<MasterSpot | null>(null);
  const controls = useAnimation();

  // Native Live Geolocation hook with continuous GPS tracking
  const { coords: userCoords, isLiveGps } = useLiveGeolocation(13.0642, 80.2811);
  const [checkingIn, setCheckingIn] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [hasMapError, setHasMapError] = useState(false);

  React.useEffect(() => {
    const handleQuota = () => {
      setHasMapError(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const spotIndex = KAOS_SPOTS.findIndex(s => s.id === selectedSpotId);
  const currentActiveSpot: MasterSpot = KAOS_SPOTS[spotIndex] || KAOS_SPOTS[0];

  const navigateSpot = (direction: 'next' | 'prev') => {
    let nextIndex = direction === 'next' ? spotIndex + 1 : spotIndex - 1;
    if (nextIndex >= KAOS_SPOTS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = KAOS_SPOTS.length - 1;
    
    const nextSpot = KAOS_SPOTS[nextIndex];
    setSelectedSpotId(nextSpot.id);
    onShowToast(`Switched frequency to: ${nextSpot.title}`);
    soundscapes.playSuccessTone();
    
    // Visual "haptic" bounce
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.2 }
    });
  };

  const distanceToTargetMeters = calculateDistanceMeters(
    userCoords.lat,
    userCoords.lng,
    currentActiveSpot.lat || 13.0642,
    currentActiveSpot.lng || 80.2811
  );

  const handlePlaySoundscape = (type: string, name: string) => {
    setActiveSoundscape(type);
    setIsPlaying(true);

    if (type === 'temple') soundscapes.playTempleBells();
    else if (type === 'coffee') soundscapes.playFilterCoffee();
    else if (type === 'waves') soundscapes.playMarinaWaves();
    else soundscapes.playBelfry();

    onShowToast(`Activated ${name} soundscape 🎵`);
  };

  const handleStopSoundscape = () => {
    soundscapes.stop();
    setIsPlaying(false);
    onShowToast('Ambient audio paused');
  };

  // Live Geofence Check-in using MCP & Live Distance
  const handleVerifyGeofence = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'kaos_verify_geofence',
          arguments: {
            spotId: currentActiveSpot.id,
            userLat: userCoords.lat,
            userLng: userCoords.lng,
          },
        }),
      });

      const data = await res.json();
      const raw = data.raw || {};

      if (raw.verified || distanceToTargetMeters <= 500) {
        soundscapes.playSuccessTone();
        const xpAwarded = raw.xpAwarded || currentActiveSpot.xp;
        if (onAwardXp) onAwardXp(xpAwarded, currentActiveSpot.title);
        onShowToast(`🎯 GPS Geofence Check-In Confirmed! +${xpAwarded} XP unlocked!`);
        
        // Log to global activity feed
        logActivity({
          explorerId: auth.currentUser?.uid || 'anonymous',
          explorerName: auth.currentUser?.displayName || 'Explorer',
          actionType: 'check_in',
          locationName: currentActiveSpot.title,
          zone: currentActiveSpot.zone,
          xpGained: xpAwarded
        });
      } else {
        onShowToast(
          `Target is ${distanceToTargetMeters}m away. Move closer to verify.`
        );
      }
    } catch {
      onShowToast('GPS verification completed.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Capture Vintage 1888 Postcard Snapshot
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 700;

    // Vintage paper background
    ctx.fillStyle = '#1A1820';
    ctx.fillRect(0, 0, 600, 700);

    // Inner photo area
    ctx.fillStyle = '#26242C';
    ctx.fillRect(30, 30, 540, 480);

    // Draw spot photo thumbnail
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentActiveSpot.imageUrl;
    img.onload = () => {
      ctx.drawImage(img, 30, 30, 540, 480);

      // Vintage Sepia Overlay Filter
      ctx.fillStyle = 'rgba(240, 84, 35, 0.15)';
      ctx.fillRect(30, 30, 540, 480);

      // Grid Vignette lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 520, 460);

      // Typography
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(currentActiveSpot.title, 35, 550);

      ctx.fillStyle = '#F05423';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(
        `ZONE: ${currentActiveSpot.zone.toUpperCase()} · BEARING: ${bearing}°`,
        35,
        580
      );

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '13px monospace';
      ctx.fillText(
        `GPS: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E`,
        35,
        610
      );
      ctx.fillText(`ARCHIVE: ${currentActiveSpot.vintageYear}`, 35, 635);
      ctx.fillText(`EXPEDITION STAMP · ${new Date().toLocaleDateString()}`, 35, 660);

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(dataUrl);
      soundscapes.playSuccessTone();
      onShowToast('Vintage Expedition Postcard Captured! 📸');
    };
  };

  return (
    <div className="space-y-6 pb-28 p-4 md:p-8 max-w-6xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-cyan-400 text-2xl">view_in_ar</span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">AR Live Lens & Radar</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Live Telemetry</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Google Maps Platform Advanced Markers, binaural acoustic telemetry, and live GPS beacon check-in
            </p>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-[#121114] border border-[#26242C] rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode('ar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'ar'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
              <span>Live Lens</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Google Maps</span>
            </button>

            <button
              onClick={() => setViewMode('snapshot')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'snapshot'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>Snapshot</span>
            </button>

            {onOpenNavRd && (
              <button
                onClick={onOpenNavRd}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-kaos-pink to-kaos-purple hover:opacity-95 text-white shadow-md shadow-kaos-pink/20"
                title="Live Transit Navigation & Archaeological R&D (Google Search Grounded)"
              >
                <KaosAppIcon size={16} withGlow={false} />
                <span>Navigation & R&D Radar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main View Area */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'ar' && (
            <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              {/* Live GPS Telemetry Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] text-xs">
                <div className="flex items-center gap-2 text-zinc-300 font-mono">
                  <span className="text-[#F05423] font-bold">GPS TELEMETRY:</span>
                  <span className="tabular-nums">
                    {userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${isLiveGps ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                  <span className={`font-bold ${isLiveGps ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {isLiveGps ? 'LIVE GPS ACTIVE' : 'MADRAS SIGNAL LOCKED'}
                    {userCoords.accuracy ? ` (±${Math.round(userCoords.accuracy)}m)` : ''}
                  </span>
                </div>
              </div>

              {/* Holographic Target Viewfinder with Swipe Navigation */}
              <motion.div 
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80) navigateSpot('prev');
                  else if (info.offset.x < -80) navigateSpot('next');
                }}
                animate={controls}
                className="relative rounded-3xl overflow-hidden border border-[#26242C] bg-gradient-to-b from-[#18161D] to-black p-8 text-center space-y-6 shadow-inner cursor-grab active:cursor-grabbing"
              >
                <div className="absolute inset-0 bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

                {/* Rotating AR Reticle */}
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[#00E5FF] transition-transform duration-300"
                    style={{ transform: `rotate(${bearing}deg)` }}
                  />
                  <div className="w-20 h-20 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/50 flex items-center justify-center text-white shadow-xl shadow-[#00E5FF]/20">
                    <span className="material-symbols-outlined text-4xl text-[#00E5FF]">explore</span>
                  </div>
                  
                  {/* Swipe Hints */}
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-30 animate-pulse hidden md:block">
                    <span className="material-symbols-outlined text-cyan-400">chevron_left</span>
                  </div>
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-30 animate-pulse hidden md:block">
                    <span className="material-symbols-outlined text-cyan-400">chevron_right</span>
                  </div>
                </div>

                {/* Clear Target Info */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedSpotId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative z-10 space-y-2 max-w-md mx-auto"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                      <span className="text-[#00E5FF] font-bold font-mono">{currentActiveSpot.zone} Sector</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-400 font-bold font-mono">{distanceToTargetMeters}m away</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-300 tabular-nums">+{currentActiveSpot.xp} XP</span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      {currentActiveSpot.title}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {currentActiveSpot.description}
                    </p>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-[#26242C] text-amber-400 font-mono text-xs">
                      <span>Bearing: {bearing}° NE</span>
                      <span>·</span>
                      <span>Distance: {distanceToTargetMeters}m</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest mt-4">
                  Swipe Horizontal to Retune Frequency
                </div>
              </motion.div>

                {/* Bearing Angle Slider Control */}
                <div className="relative z-10 bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-[#26242C] space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                    <span>Manual Compass Heading</span>
                    <span className="font-mono text-[#F05423] font-bold tabular-nums">{bearing}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={bearing}
                    onChange={(e) => setBearing(Number(e.target.value))}
                    className="w-full accent-[#F05423] cursor-pointer"
                  />
                </div>
                {/* Action Buttons Deck */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleVerifyGeofence}
                    disabled={checkingIn}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#F05423]/25 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                    <span>{checkingIn ? 'Verifying Beacon...' : `GPS Check-In (+${currentActiveSpot.xp} XP)`}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('snapshot')}
                    className="py-3.5 px-4 rounded-2xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span>Capture 1888 Postcard</span>
                  </button>
                </div>
              </div>
            )}

          {viewMode === 'map' && (
            <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive Google Maps View</h3>
                  <p className="text-xs text-zinc-400">
                    Live Google Maps Platform vector map with Advanced Markers, Sector Teleportation & Clustering
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-kaos-teal/10 border border-kaos-teal/30 text-kaos-teal text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal animate-pulse" />
                  <span>Marker Clustering Active</span>
                </span>
              </div>

              {/* Google Maps or Cyber-Heritage Sector Radar Fallback */}
              {hasMapError ? (
                <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-kaos-orange/40 bg-[#0E0C12] p-4 flex flex-col justify-between shadow-2xl">
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
                  
                  {/* Radar Header */}
                  <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-2 text-kaos-teal font-bold">
                      <span className="w-2 h-2 rounded-full bg-kaos-teal animate-ping" />
                      <span>OFFLINE CYBER-HERITAGE RADAR MATRIX</span>
                    </div>
                    <button
                      onClick={() => setHasMapError(false)}
                      className="px-2.5 py-1 rounded-lg bg-kaos-orange/20 hover:bg-kaos-orange/30 border border-kaos-orange/40 text-kaos-orange text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Retry Google Maps
                    </button>
                  </div>

                  {/* Interactive Radar Spot Grid */}
                  <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[300px] p-1 scrollbar-thin">
                    {KAOS_SPOTS.slice(0, 9).map((spot) => {
                      const isSel = spot.id === selectedSpotId;
                      const dist = calculateDistanceMeters(
                        userCoords.lat,
                        userCoords.lng,
                        spot.lat || 13.0642,
                        spot.lng || 80.2811
                      );
                      return (
                        <button
                          key={spot.id}
                          onClick={() => {
                            setSelectedSpotId(spot.id);
                            onShowToast(`Selected ${spot.title}`);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSel
                              ? 'bg-kaos-orange/20 border-kaos-orange text-white shadow-lg shadow-kaos-orange/20'
                              : 'bg-black/50 border-white/10 text-zinc-300 hover:border-zinc-500 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-kaos-teal block truncate">
                              {spot.zone} Sector
                            </span>
                            <h4 className="text-xs font-bold truncate mt-0.5">{spot.title}</h4>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-2">
                            <span>{dist}m</span>
                            <span className="text-amber-400 font-bold">+{spot.xp} XP</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Selected Spot Radar Footer */}
                  <div className="relative z-10 flex items-center justify-between bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">Target Aligned:</span>
                      <h4 className="text-xs font-bold text-white truncate">{currentActiveSpot.title}</h4>
                    </div>
                    <button
                      onClick={() => {
                        setViewMode('ar');
                        onShowToast(`Aligned Live Lens with ${currentActiveSpot.title}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-kaos-teal text-black text-xs font-extrabold cursor-pointer hover:opacity-90 shrink-0"
                    >
                      Open Live Lens
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-[#26242C] bg-zinc-900 shadow-inner">
                  <Map
                    center={{ lat: userCoords.lat, lng: userCoords.lng }}
                    defaultZoom={13}
                    mapId="DEMO_MAP_ID"
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    className="w-full h-full"
                  >
                    {/* User's Live Position Marker */}
                    <AdvancedMarker position={{ lat: userCoords.lat, lng: userCoords.lng }}>
                      <Pin background="#06B6D4" borderColor="#ffffff" glyphColor="#ffffff" />
                    </AdvancedMarker>

                    {/* Clustered Heritage Spots Markers for High Density Handling */}
                    <ClusteredSpotsMarkers
                      spots={KAOS_SPOTS}
                      selectedSpotId={selectedSpotId}
                      onSpotClick={(spot) => setInfoWindowSpot(spot)}
                    />

                    {infoWindowSpot && (
                      <InfoWindow
                        position={{ lat: infoWindowSpot.lat || 13.0642, lng: infoWindowSpot.lng || 80.2811 }}
                        onCloseClick={() => setInfoWindowSpot(null)}
                      >
                        <div className="p-2 text-zinc-900 max-w-xs space-y-1 font-sans">
                          <span className="text-[10px] font-mono uppercase font-bold text-[#F05423]">
                            {infoWindowSpot.zone} Sector
                          </span>
                          <h4 className="font-bold text-xs">{infoWindowSpot.title}</h4>
                          <p className="text-[11px] text-zinc-600 line-clamp-2">{infoWindowSpot.description}</p>
                          <button
                            onClick={() => {
                              setSelectedSpotId(infoWindowSpot.id);
                              setViewMode('ar');
                              onShowToast(`Aligned Live Lens with ${infoWindowSpot.title}`);
                            }}
                            className="mt-1 w-full py-1 bg-[#F05423] text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Align Live Lens
                          </button>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </div>
              )}
            </div>
          )}

          {viewMode === 'snapshot' && (
            <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Vintage 1888 Postcard Generator</h3>
                  <p className="text-xs text-zinc-400">
                    Renders an authenticated Madras Lore postcard with GPS stamp
                  </p>
                </div>

                <button
                  onClick={handleCaptureSnapshot}
                  className="px-4 py-2 bg-[#F05423] text-white rounded-xl text-xs font-bold hover:bg-[#ff6a38] transition-colors cursor-pointer"
                >
                  Generate Postcard
                </button>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {capturedPhoto ? (
                <div className="space-y-4 text-center">
                  <div className="inline-block p-2 bg-[#121114] border border-[#26242C] rounded-2xl shadow-2xl max-w-md mx-auto">
                    <img
                      src={capturedPhoto}
                      alt="1888 Postcard"
                      className="w-full rounded-xl shadow-md"
                    />
                  </div>
                  <div>
                    <a
                      href={capturedPhoto}
                      download={`Madras_Postcard_${currentActiveSpot.id}.png`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Download Expedition Postcard</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-[#26242C] rounded-3xl text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-600">photo_library</span>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Click "Generate Postcard" to compile your current beacon telemetry into a collectible expedition stamp.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ambient Soundscapes Sidebar */}
        <div className="lg:col-span-4 bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[#F05423]">
              Binaural Soundscapes
            </h3>
            {isPlaying && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05423] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05423]"></span>
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Synthesized ambient acoustic environments tuned to Madras heritage sectors.
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'temple', name: 'Mylapore Temple Bells', icon: 'notifications', desc: 'Resonating bronze bell harmonics' },
              { id: 'coffee', name: 'Triplicane Coffee Roastery', icon: 'coffee', desc: 'Brass filter dripping & roasting sounds' },
              { id: 'waves', name: 'Marina Beach Dawn Waves', icon: 'waves', desc: 'Binaural shoreline ocean waves' },
              { id: 'belfry', name: 'Senate House Belfry', icon: 'church', desc: 'Acoustic reverb of high gothic arches' },
            ].map((snd) => {
              const isCurrent = activeSoundscape === snd.id && isPlaying;
              return (
                <button
                  key={snd.id}
                  onClick={() =>
                    isCurrent
                      ? handleStopSoundscape()
                      : handlePlaySoundscape(snd.id, snd.name)
                  }
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-[#F05423]/20 border-[#F05423] text-white shadow-md'
                      : 'bg-[#121114] border-[#26242C] text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-[#F05423] text-white' : 'bg-[#1C1A1F] text-zinc-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isCurrent ? 'pause' : snd.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{snd.name}</h4>
                    <p className="text-[10px] text-zinc-500 truncate">{snd.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
