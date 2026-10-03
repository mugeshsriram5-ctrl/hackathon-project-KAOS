import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Quest } from '../types';
import { LiveLens } from './LiveLens';
import { ChatAttachment } from '../types/chat';

interface QuestBoxProps {
  quest: Quest;
  onVerify: () => void;
  onClose: () => void;
  verificationHandler?: (imageData: string) => void | Promise<void>;
  onOpenShareToChat?: (attachment: ChatAttachment) => void;
}

export const QuestBox: React.FC<QuestBoxProps> = ({
  quest,
  onVerify,
  onClose,
  verificationHandler,
  onOpenShareToChat,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showLiveLens, setShowLiveLens] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const triggerVerificationProcess = (imageData?: string) => {
    if (imageData) {
      setCapturedPhoto(imageData);
    }
    setVerifying(true);

    if (imageData && verificationHandler) {
      try {
        verificationHandler(imageData);
      } catch (e) {
        console.warn('Custom verificationHandler error:', e);
      }
    }

    // Simulate AI Telemetry & Visual Verification Scan
    setTimeout(() => {
      setVerifying(false);
      setCompleted(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#F05423', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'],
      });

      // Invoke parent onVerify callback after short delay to display celebration state
      setTimeout(() => {
        onVerify();
      }, 2500);
    }, 1800);
  };

  const handleLiveLensSnapshot = (imageData: string) => {
    setShowLiveLens(false);
    triggerVerificationProcess(imageData);
  };

  // Listen for LiveLens capture events across the application
  useEffect(() => {
    const handleLiveLensEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ imageData: string }>;
      if (customEvent.detail?.imageData && !verifying && !completed) {
        handleLiveLensSnapshot(customEvent.detail.imageData);
      }
    };

    window.addEventListener('kaos_livelens_captured', handleLiveLensEvent);
    return () => {
      window.removeEventListener('kaos_livelens_captured', handleLiveLensEvent);
    };
  }, [verifying, completed]);

  const handleSubmitTask = () => {
    triggerVerificationProcess(capturedPhoto || undefined);
  };

  const handleShareQuest = () => {
    if (onOpenShareToChat) {
      onOpenShareToChat({
        type: 'quest',
        id: quest.id || 'quest_' + Date.now(),
        title: quest.title,
        description: quest.task,
        location: (quest as any).spotTitle || (quest as any).location || 'Chennai Landmark',
        extraData: {
          objective: quest.task,
          estimatedMinutes: 15,
        },
      });
    }
  };

  return (
    <AnimatePresence>
      {/* FULLSCREEN LIVE LENS OVERLAY WHEN LAUNCHED FROM QUESTBOX */}
      {showLiveLens && (
        <LiveLens
          onClose={() => setShowLiveLens(false)}
          onSnapshot={handleLiveLensSnapshot}
          verificationHandler={verificationHandler}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-50 w-88 md:w-96 bg-[#1C1A1F]/95 backdrop-blur-xl border border-[#26242C] p-5 rounded-3xl shadow-2xl overflow-hidden font-sans"
      >
        {/* Glow accent ring */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F05423] via-amber-400 to-[#F05423]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F05423]/20 border border-[#F05423]/40 flex items-center justify-center text-[#F05423] shrink-0">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#F05423] font-bold uppercase tracking-wider block">
                Active Quest
              </span>
              <h3 className="text-sm font-extrabold text-white leading-snug">{quest.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onOpenShareToChat && (
              <button
                onClick={handleShareQuest}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#26242C] transition-colors cursor-pointer"
                title="Share Quest to Messages"
              >
                <span className="material-symbols-outlined text-base">forum</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#26242C] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {completed ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h4 className="text-sm font-extrabold text-white">Quest Verified!</h4>
            <p className="text-xs text-emerald-400 font-mono font-bold">
              +{quest.xpReward || 150} XP Awarded to Passport
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Task Details */}
            <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-2">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Objective
                </span>
                <p className="text-zinc-200 text-xs font-medium leading-normal">{quest.task}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Completion Condition
                </span>
                <p className="text-zinc-300 text-xs leading-normal">{quest.verification}</p>
              </div>
            </div>

            {/* CAPTURED PHOTO PREVIEW */}
            {capturedPhoto && (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50">
                <img src={capturedPhoto} alt="Task proof snapshot" className="w-full h-28 object-cover" />
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>Telemetry Photo Attached</span>
                </div>
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                >
                  Retake
                </button>
              </div>
            )}

            {/* LIVE LENS & SUBMIT TASK BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowLiveLens(true)}
                disabled={verifying}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950 to-[#121114] hover:from-cyan-900 border border-cyan-500/40 text-cyan-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                title="Launch LiveLens AR Camera for Automatic Verification"
              >
                <span className="material-symbols-outlined text-sm text-cyan-400 animate-pulse">
                  view_in_ar
                </span>
                <span>Live Lens</span>
              </button>

              <button
                onClick={handleSubmitTask}
                disabled={verifying}
                className="flex-1 bg-gradient-to-r from-[#F05423] to-[#d64a1e] text-white py-2.5 px-4 rounded-xl font-bold text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#F05423]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    <span>Verifying Telemetry...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                    <span>Submit Task (+{quest.xpReward || 150} XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
