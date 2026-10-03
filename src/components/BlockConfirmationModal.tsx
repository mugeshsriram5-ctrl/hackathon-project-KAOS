import React from 'react';

interface BlockConfirmationModalProps {
  targetName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBlock: () => void;
}

export const BlockConfirmationModal: React.FC<BlockConfirmationModalProps> = ({
  targetName,
  isOpen,
  onClose,
  onConfirmBlock,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-2xl">
          <span className="material-symbols-outlined text-2xl">block</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Block this player?</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You won't be able to message or interact with each other through KAOS. Any active friendships or pending requests will be immediately removed.
          </p>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl bg-[#121114] border border-[#26242C] text-zinc-300 hover:text-white font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmBlock();
              onClose();
            }}
            className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow-lg shadow-rose-600/25"
          >
            Block
          </button>
        </div>
      </div>
    </div>
  );
};
