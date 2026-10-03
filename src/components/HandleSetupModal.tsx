import React, { useState } from 'react';
import { validateHandle } from '../utils/handleValidation';

interface HandleSetupModalProps {
  isOpen: boolean;
  onSaveHandle: (handle: string) => Promise<void>;
  onClose: () => void;
  currentHandle?: string;
}

export const HandleSetupModal: React.FC<HandleSetupModalProps> = ({
  isOpen,
  onSaveHandle,
  onClose,
  currentHandle = '',
}) => {
  const [handleInput, setHandleInput] = useState(currentHandle);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (val: string) => {
    setHandleInput(val);
    const res = validateHandle(val);
    if (!res.isValid) {
      setErrorMsg(res.error || null);
    } else {
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateHandle(handleInput);
    if (!res.isValid) {
      setErrorMsg(res.error || 'Please enter a valid handle.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveHandle(res.normalizedHandle);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative overflow-hidden"
      >
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#F05423]/20 border border-[#F05423]/40 text-[#F05423] flex items-center justify-center mx-auto text-2xl font-bold">
            @
          </div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">
            Choose your KAOS handle
          </h3>
          <p className="text-xs text-zinc-400">
            Your unique handle allows fellow explorers to find and connect with you on KAOS.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              KAOS Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-zinc-500 font-mono text-sm font-bold">
                @
              </span>
              <input
                type="text"
                autoFocus
                value={handleInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="e.g. usha_explorer"
                className={`w-full bg-[#121114] border rounded-2xl pl-8 pr-4 py-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none transition-colors ${
                  errorMsg
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-[#26242C] focus:border-[#F05423]'
                }`}
              />
            </div>
            {errorMsg ? (
              <p className="text-[11px] text-rose-400 font-medium pt-0.5 animate-in fade-in duration-150 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                <span>{errorMsg}</span>
              </p>
            ) : (
              <p className="text-[10px] text-emerald-400 font-mono pt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>Handle format valid</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#121114] border border-[#26242C] text-zinc-400 hover:text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!errorMsg}
              className="px-5 py-2.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold cursor-pointer transition-colors shadow-lg shadow-[#F05423]/25 disabled:opacity-50"
            >
              {isSubmitting ? 'Reserving...' : 'Save Handle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
