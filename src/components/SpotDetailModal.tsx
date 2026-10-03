import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterSpot } from '../types';
import { SpotShareModal } from './SpotShareModal';
import { useSoundscape } from '../context/SoundscapeContext';
import { sqlDb } from '../lib/sqlDatabase';
import { ChatAttachment } from '../types/chat';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { ArCameraView } from './ArCameraView';

interface SpotDetailModalProps {
  spot: MasterSpot | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onStartQuest?: (spot: MasterSpot) => void;
  onOpenShareToChat?: (attachment: ChatAttachment) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  onClose,
  onShowToast,
  onStartQuest,
  onOpenShareToChat,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { currentSpot, isPlaying, playSpotSoundscape, togglePlay, setIsMixerOpen } = useSoundscape();
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showArView, setShowArView] = useState(false);

  useEffect(() => {
    if (spot) {
      setIsSaved(sqlDb.isSpotSaved(spot.id));
    }
  }, [spot]);

  const [placePhotos, setPlacePhotos] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const placesLibrary = useMapsLibrary('places');

  useEffect(() => {
    if (!spot) return;
    const fallbacks = [
      spot.imageUrl,
      'https://images.unsplash.com/photo-1596422846543-75c6fc18a593?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545235621-3f6b76649e78?q=80&w=600&auto=format&fit=crop'
    ];
    setPlacePhotos(fallbacks);

    const googleObj = (window as any).google;
    if (!placesLibrary && !googleObj?.maps?.places) return;

    setIsLoadingPhotos(true);
    try {
      const PlacesServiceClass = placesLibrary?.PlacesService || googleObj?.maps?.places?.PlacesService;
      const PlacesStatus = googleObj?.maps?.places?.PlacesServiceStatus;

      if (!PlacesServiceClass) {
        setIsLoadingPhotos(false);
        return;
      }

      const dummyDiv = document.createElement('div');
      const service = new PlacesServiceClass(dummyDiv);
      const request = {
        query: `${spot.title}, ${spot.zone}, Chennai, Tamil Nadu`,
      };

      service.textSearch(request, (results: any, status: any) => {
        setIsLoadingPhotos(false);
        const isOk = status === 'OK' || (PlacesStatus && status === PlacesStatus.OK);
        if (isOk && results && results[0] && results[0].photos) {
          const fetchedUrls = results[0].photos.slice(0, 6).map((photo: any) =>
            typeof photo.getUrl === 'function'
              ? photo.getUrl({ maxWidth: 800, maxHeight: 600 })
              : spot.imageUrl
          );
          if (fetchedUrls.length > 0) {
            setPlacePhotos([spot.imageUrl, ...fetchedUrls]);
          }
        }
      });
    } catch (err) {
      setIsLoadingPhotos(false);
      console.warn('Google Places API photo fetch error:', err);
    }
  }, [spot, placesLibrary]);

  // Clean up speech synthesis when modal closes
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const lastSpotRef = useRef<MasterSpot | null>(null);
  if (spot) {
    lastSpotRef.current = spot;
  }
  const currentModalSpot = spot || lastSpotRef.current;

  const isCurrentSpotPlaying = currentModalSpot ? currentSpot?.id === currentModalSpot.id && isPlaying : false;

  const handleToggleSoundscape = () => {
    if (!currentModalSpot) return;
    if (currentSpot?.id === currentModalSpot.id) {
      togglePlay();
    } else {
      playSpotSoundscape(currentModalSpot);
    }
  };

  const handleOpenMixer = () => {
    if (!currentModalSpot) return;
    if (currentSpot?.id !== currentModalSpot.id) {
      playSpotSoundscape(currentModalSpot);
    }
    setIsMixerOpen(true);
  };

  const handleToggleSave = () => {
    if (!currentModalSpot) return;
    const newState = sqlDb.toggleSaveSpot(currentModalSpot.id);
    setIsSaved(newState);
    onShowToast(
      newState
        ? `Added "${currentModalSpot.title}" to Favorites! ❤️`
        : `Removed "${currentModalSpot.title}" from Favorites.`
    );
  };

  const handleToggleSpeech = () => {
    if (!currentModalSpot) return;
    if (!('speechSynthesis' in window)) {
      onShowToast('Text-to-speech voice guide is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      onShowToast('Voice guide paused.');
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${currentModalSpot.title}. Located in ${currentModalSpot.zone} sector. ${currentModalSpot.description}. Historical Chronicle: ${currentModalSpot.fullStory}. Curator commentary: ${currentModalSpot.audioGuideScript}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      onShowToast(`Playing voice guide for ${currentModalSpot.title}`);
    }
  };

  const handleNavigate = () => {
    if (!currentModalSpot) return;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      currentModalSpot.title + ' ' + currentModalSpot.zone + ' Chennai'
    )}`;
    window.open(mapsUrl, '_blank');
  };

  const handleClose = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {spot && currentModalSpot && (
        <motion.div
          key="spot-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none"
          onClick={handleClose}
        >
          <motion.div
            key="spot-detail-modal"
            id="spot-detail-modal"
            initial={{ opacity: 0, y: 56, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.96 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 340,
              mass: 0.85,
            }}
            className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image Hero */}
            <div className="relative h-56 w-full">
              <img
                src={currentModalSpot.imageUrl}
                alt={currentModalSpot.title}
                className="w-full h-full object-cover rounded-t-3xl"
              />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A1F] via-[#1C1A1F]/30 to-transparent" />

            {/* Top Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#F05423] font-mono text-xs font-bold border border-[#F05423]/30">
                {spot.zone} Sector
              </span>

              <div className="flex items-center gap-2">
                {/* Save to Passport Button */}
                <button
                  onClick={handleToggleSave}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30 scale-105'
                      : 'bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-black/80'
                  }`}
                  title={isSaved ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isSaved ? 'favorite' : 'favorite_border'}
                  </span>
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{spot.title}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span>{spot.openHours}</span>
                <span aria-hidden="true">·</span>
                <span>{spot.duration}</span>
                <span aria-hidden="true">·</span>
                <span className="text-zinc-300">{spot.category}</span>
              </div>
            </div>

            {/* Spatial Audio Guide Card + Human Voice Narration */}
            <div className="p-4 rounded-2xl bg-[#121114] border border-[#26242C] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSoundscape}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isCurrentSpotPlaying
                        ? 'bg-[#F05423] text-white shadow-lg shadow-[#F05423]/30 scale-105'
                        : 'bg-[#26242C] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {isCurrentSpotPlaying ? 'pause' : 'graphic_eq'}
                    </span>
                  </button>
                  <div>
                    <p className="text-xs font-bold text-white">Binaural Soundscape</p>
                    <p className="text-[11px] text-zinc-400">
                      {isCurrentSpotPlaying ? 'Binaural 3D ambient audio active' : 'Tap to stream spatial audio'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrentSpotPlaying && (
                    <div className="flex items-end gap-1 h-5 pr-1">
                      <span className="w-1 bg-[#F05423] rounded-full animate-pulse h-4" />
                      <span className="w-1 bg-[#F05423] rounded-full animate-pulse h-5 delay-75" />
                      <span className="w-1 bg-[#F05423] rounded-full animate-pulse h-3 delay-150" />
                      <span className="w-1 bg-[#F05423] rounded-full animate-pulse h-5 delay-100" />
                    </div>
                  )}

                  <button
                    onClick={handleOpenMixer}
                    className="px-2.5 py-1.5 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] hover:border-[#F05423]/50 text-[11px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                    title="Open Multi-Track Studio Mixer"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#F05423]">tune</span>
                    <span>Mixer</span>
                  </button>
                </div>
              </div>

              {/* Speech Narration Button */}
              <button
                onClick={handleToggleSpeech}
                className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 animate-pulse'
                    : 'bg-[#1C1A1F] border-[#26242C] text-zinc-300 hover:text-white hover:border-zinc-600'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isSpeaking ? 'volume_up' : 'record_voice_over'}
                </span>
                <span>{isSpeaking ? 'Pause Audio Guide' : 'Play Audio Guide (Speech Synthesis)'}</span>
              </button>

              {/* AR Past-Meets-Present 3D Wireframe Button */}
              <button
                onClick={() => setShowArView(true)}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-kaos-teal/20 to-kaos-purple/20 hover:from-kaos-teal/30 hover:to-kaos-purple/30 border border-kaos-teal/40 text-kaos-teal font-black tracking-wider uppercase text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(20,255,236,0.15)]"
              >
                <span className="material-symbols-outlined text-base">view_in_ar</span>
                <span>Launch AR 3D Wireframe Overlay</span>
              </button>
            </div>

            {showArView && (
              <ArCameraView
                spot={currentModalSpot}
                onClose={() => setShowArView(false)}
                onRewardXp={(amt, reason) => {
                  onShowToast(`+${amt} XP: ${reason} 🌟`);
                }}
              />
            )}

            {/* Horizontal Scrollable Photo Gallery (Google Places Imagery) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#F05423] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>Google Places Photo Gallery</span>
                </h3>
                {isLoadingPhotos && (
                  <span className="text-[10px] text-zinc-400 animate-pulse">Fetching Google Places photos...</span>
                )}
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {placePhotos.map((photoUrl, pIdx) => (
                  <div
                    key={pIdx}
                    className="relative shrink-0 w-36 h-24 rounded-2xl overflow-hidden border border-[#26242C] shadow-md group cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`${spot.title} photo ${pIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-zinc-300 font-mono">
                      {pIdx === 0 ? 'Primary' : `Photo ${pIdx}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Story */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#F05423] uppercase tracking-wider">
                Historical Chronicle
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{spot.fullStory}</p>
            </div>

            {/* Audio Script Quote */}
            <div className="p-4 rounded-2xl bg-[#26242C]/40 border-l-2 border-[#F05423] space-y-1">
              <p className="text-xs font-semibold text-zinc-300">Curator Commentary</p>
              <p className="text-xs italic text-zinc-400">"{spot.audioGuideScript}"</p>
            </div>

            {/* Architectural & Vintage Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C]">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Style</p>
                <p className="font-semibold text-zinc-200 mt-0.5">{spot.architecturalStyle}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C]">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Archive Record</p>
                <p className="font-semibold text-zinc-200 mt-0.5">{spot.vintageYear}</p>
              </div>
            </div>

            {/* Secret Perk Callout */}
            {spot.secretPerkTitle && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-300">Secret Explorer Perk Available</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{spot.secretPerkTitle}</p>
                </div>
                <button
                  onClick={() => onShowToast(`Unlocked perk for ${spot.title} in your Passport!`)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Claim
                </button>
              </div>
            )}

            {/* Start AI Exploration Quest button */}
            <button
              onClick={() => onStartQuest?.(spot)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#F05423] to-[#FF8A00] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#F05423]/25"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Start AI Exploration Quest</span>
            </button>

            {/* Action Bar (Directions, Share, and Close) */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleNavigate}
                className="py-2.5 rounded-xl bg-[#121114] hover:bg-[#1C1A1F] border border-[#F05423]/50 text-[#F05423] hover:text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                title="Open turn-by-turn directions in Google Maps"
              >
                <span className="material-symbols-outlined text-[16px]">directions</span>
                <span>Directions</span>
              </button>

              <button
                onClick={() => setIsShareOpen(true)}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#F05423]/25"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Share</span>
              </button>

              <button
                onClick={handleClose}
                className="py-2.5 rounded-xl bg-[#26242C] hover:bg-[#33313a] text-zinc-200 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>

    {/* Share Modal Dialog */}
    {currentModalSpot && (
      <SpotShareModal
        spot={currentModalSpot}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onShowToast={onShowToast}
        onOpenShareToChat={onOpenShareToChat}
      />
    )}
  </>
);
};

export default SpotDetailModal;

