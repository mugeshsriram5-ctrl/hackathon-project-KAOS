import React, { useState, useEffect, useRef } from 'react';
import { MasterSpot } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface ArCameraViewProps {
  spot?: MasterSpot | null;
  onClose: () => void;
  onRewardXp: (amount: number, reason: string) => void;
}

export const ArCameraView: React.FC<ArCameraViewProps> = ({ spot, onClose, onRewardXp }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [wireframeStyle, setWireframeStyle] = useState<'cyan' | 'amber' | 'purple'>('cyan');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          triggerHaptic('success');
        }
      } catch (err) {
        console.warn('Camera access error or unsupported:', err);
        setCameraError('Camera access unavailable. Using simulated Coromandel AR holographic view.');
        setCameraActive(false);
      }
    }
    startCamera();

    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1) % 360);
    }, 50);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCaptureScan = () => {
    setIsScanning(true);
    triggerHaptic('heavy');
    setTimeout(() => {
      setIsScanning(false);
      setScannedSuccess(true);
      triggerHaptic('quest');
      onRewardXp(120, `AR Past-Meets-Present Hologram Scan: ${spot?.title || 'Chennai Landmark'}`);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden select-none">
      {/* Live Camera Stream or Simulated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            cameraActive ? 'opacity-90' : 'opacity-0'
          }`}
        />
        {!cameraActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#121114] via-[#1a1721] to-[#0b0a0d] flex items-center justify-center">
            {/* Simulated atmospheric heritage backdrop grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#F05423_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[600px] h-[600px] rounded-full border border-kaos-teal/20 animate-ping" />
            </div>
          </div>
        )}

        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#1f1c27_1px,transparent_1px),linear-gradient(to_bottom,#1f1c27_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 w-full max-w-4xl mx-auto p-4 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-kaos-teal animate-pulse shadow-[0_0_12px_rgba(20,255,236,0.8)]" />
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-kaos-teal tracking-widest uppercase">AR Past-Meets-Present</span>
            <span className="text-sm sm:text-base font-black text-white">{spot?.title || 'Chennai Indo-Saracenic Grid'}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl bg-black/60 hover:bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
          title="Exit AR View"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Center 3D Wireframe Hologram Projection */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        {cameraError && (
          <div className="absolute top-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono max-w-md text-center backdrop-blur-md">
            {cameraError}
          </div>
        )}

        {/* 3D Wireframe SVG Model Container */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center pointer-events-none">
          {/* Rotating Wireframe Dome / Structure */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
            style={{ transform: `rotateY(${rotationAngle}deg) rotateX(15deg)` }}
          >
            <svg
              viewBox="0 0 200 200"
              className={`w-full h-full filter drop-shadow-[0_0_20px_${
                wireframeStyle === 'cyan' ? 'rgba(20,255,236,0.6)' : wireframeStyle === 'amber' ? 'rgba(245,158,11,0.6)' : 'rgba(157,78,221,0.6)'
              }]`}
            >
              {/* Wireframe Architectural Dome & Columns */}
              <ellipse
                cx="100"
                cy="140"
                rx="70"
                ry="25"
                fill="none"
                stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <path
                d="M30 140 L30 100 Q100 20 170 100 L170 140 Z"
                fill="none"
                stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'}
                strokeWidth="2"
              />
              {/* Supporting Pillars */}
              <line x1="50" y1="140" x2="50" y2="80" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1.5" />
              <line x1="80" y1="140" x2="80" y2="60" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1.5" />
              <line x1="120" y1="140" x2="120" y2="60" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1.5" />
              <line x1="150" y1="140" x2="150" y2="80" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1.5" />
              {/* Central Spire */}
              <line x1="100" y1="60" x2="100" y2="25" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="2" />
              <circle cx="100" cy="20" r="4" fill={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} />
              {/* Cross-hatch structural wireframe lines */}
              <path d="M50 110 Q100 80 150 110" fill="none" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1" strokeDasharray="2 2" />
              <path d="M40 125 Q100 100 160 125" fill="none" stroke={wireframeStyle === 'cyan' ? '#14FFEC' : wireframeStyle === 'amber' ? '#F59E0B' : '#9D4EDD'} strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Holographic Target Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 rounded-full border border-dashed border-white/30 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute w-16 h-16 border-t-2 border-l-2 border-kaos-teal top-12 left-12" />
            <div className="absolute w-16 h-16 border-t-2 border-r-2 border-kaos-teal top-12 right-12" />
            <div className="absolute w-16 h-16 border-b-2 border-l-2 border-kaos-teal bottom-12 left-12" />
            <div className="absolute w-16 h-16 border-b-2 border-r-2 border-kaos-teal bottom-12 right-12" />
          </div>
        </div>

        {/* Vintage Era Metadata Badge */}
        <div className="mt-4 px-4 py-2 rounded-2xl bg-black/70 border border-zinc-700 backdrop-blur-md flex items-center gap-3 text-center">
          <span className="material-symbols-outlined text-kaos-teal text-lg">history_edu</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono text-zinc-400">Archival Projection Model</span>
            <span className="text-xs font-mono font-bold text-white">{spot?.vintageYear || '1888 Madras Heritage Survey'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Control Deck */}
      <div className="relative z-20 w-full max-w-xl mx-auto p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Style Selector Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWireframeStyle('cyan')}
            className={`px-3 py-1 rounded-xl font-mono text-xs cursor-pointer transition-all ${
              wireframeStyle === 'cyan' ? 'bg-kaos-teal text-black font-bold shadow-[0_0_12px_rgba(20,255,236,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            Cyan Hologram
          </button>
          <button
            onClick={() => setWireframeStyle('amber')}
            className={`px-3 py-1 rounded-xl font-mono text-xs cursor-pointer transition-all ${
              wireframeStyle === 'amber' ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            Amber Archive
          </button>
          <button
            onClick={() => setWireframeStyle('purple')}
            className={`px-3 py-1 rounded-xl font-mono text-xs cursor-pointer transition-all ${
              wireframeStyle === 'purple' ? 'bg-kaos-purple text-white font-bold shadow-[0_0_12px_rgba(157,78,221,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            Imperial Violet
          </button>
        </div>

        {/* Capture / Scan Action Button */}
        {scannedSuccess ? (
          <div className="w-full py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            AR Hologram Scanned (+120 XP Unlocked!)
          </div>
        ) : (
          <button
            onClick={handleCaptureScan}
            disabled={isScanning}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-kaos-orange to-amber-500 hover:from-kaos-orange/90 hover:to-amber-400 text-white font-black tracking-wider uppercase text-sm shadow-lg shadow-kaos-orange/30 cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            {isScanning ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Projecting Architectural Wireframe...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">view_in_ar</span>
                Capture Past-Meets-Present Scan
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
