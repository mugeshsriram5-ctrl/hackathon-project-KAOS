import React, { useState } from 'react';
import { MasterSpot } from '../types';
import { ChatAttachment } from '../types/chat';

interface SpotShareModalProps {
  spot: MasterSpot;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onOpenShareToChat?: (attachment: ChatAttachment) => void;
}

export const SpotShareModal: React.FC<SpotShareModalProps> = ({
  spot,
  isOpen,
  onClose,
  onShowToast,
  onOpenShareToChat,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  if (!isOpen) return null;

  const deepLink = `${window.location.origin}/?spot=${encodeURIComponent(spot.id)}`;

  const socialPostCaption = `📍 Discovering Chennai's Hidden Heritage: ${spot.title}

🏛️ Architectural Style: ${spot.architecturalStyle}
📜 Archive Record: Built circa ${spot.vintageYear} (${spot.zone} Sector)
🎧 Binaural Soundscape: "${spot.audioGuideScript.substring(0, 80)}..."

Explore this landmark, take the AI Quest, and experience binaural spatial audio guide:
${deepLink}

#KAOSChennai #MadrasHeritage #ChennaiExploration #${spot.category.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopiedLink(true);
      onShowToast('Deep link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onShowToast('Failed to copy link.');
    }
  };

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(socialPostCaption);
      setCopiedPost(true);
      onShowToast('Social post caption copied!');
      setTimeout(() => setCopiedPost(false), 2500);
    } catch {
      onShowToast('Failed to copy caption.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Explore ${spot.title} on KAOS`,
          text: `Check out ${spot.title} in ${spot.zone} Sector, Chennai!`,
          url: deepLink,
        });
        onShowToast('Shared via native app!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onShowToast('Share canceled.');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Check out ${spot.title} on KAOS Chennai Exploration: ${deepLink}`
    )}`;
    window.open(url, '_blank');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Exploring ${spot.title} in Chennai!`
    )}&url=${encodeURIComponent(deepLink)}`;
    window.open(url, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      deepLink
    )}`;
    window.open(url, '_blank');
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26242C] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F05423] to-[#FF8A00] flex items-center justify-center text-white shadow-md shadow-[#F05423]/25">
              <span className="material-symbols-outlined text-lg">share</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Discovery</h3>
              <p className="text-xs text-zinc-400">Invite fellow explorers to {spot.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#121114] border border-[#26242C] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Spot Preview Card */}
        <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center gap-3">
          <img
            src={spot.imageUrl}
            alt={spot.title}
            className="w-14 h-14 rounded-xl object-cover border border-[#26242C] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{spot.title}</h4>
            <p className="text-xs text-zinc-400 font-mono">{spot.zone} Sector · {spot.category}</p>
            <p className="text-[11px] text-[#F05423] font-mono mt-0.5 font-bold">
              ★ {spot.rating} (128 Explorer Reviews)
            </p>
          </div>
        </div>

        {/* 1-Click Share to App Messages */}
        {onOpenShareToChat && (
          <div className="p-3 rounded-2xl bg-[#F05423]/10 border border-[#F05423]/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#F05423]">forum</span>
              <div>
                <span className="text-xs font-bold text-white block">In-App Chat Messages</span>
                <span className="text-[10px] text-zinc-400">Share directly with 1-on-1 chats or groups</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenShareToChat({
                  type: 'place',
                  id: spot.id,
                  title: spot.title,
                  description: spot.description,
                  imageUrl: spot.imageUrl,
                  location: spot.zone + ' Sector',
                });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#F05423] hover:bg-[#d64a1e] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Share to Messages
            </button>
          </div>
        )}

        {/* Direct Link Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">Spot Link</span>
            <span className="text-[10px] font-mono text-zinc-500">Universal Link</span>
          </div>

          <div className="p-1.5 pl-3 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-zinc-400 truncate select-all">
              {deepLink}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#F05423] hover:bg-[#ff6a38] text-white shadow-md shadow-[#F05423]/25'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedLink ? 'check' : 'content_copy'}
              </span>
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Social Sharing Channels */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-300 block">External Share Channels</span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[#F05423]">send</span>
                <span>Native App</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="p-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-base text-emerald-400">💬</span>
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="p-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-base text-cyan-400">𝕏</span>
              <span>X (Twitter)</span>
            </button>

            <button
              onClick={handleLinkedInShare}
              className="p-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-base text-blue-400">🔗</span>
              <span>LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#26242C] flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">
            Shared links automatically trigger the full dossier & audio guide
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#26242C] hover:bg-[#33313a] text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotShareModal;
