import React, { useState } from 'react';
import { submitUserReport } from '../services/socialService';

interface ReportPlayerModalProps {
  reportedUserId: string;
  reportedName: string;
  reporterId: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Spam',
  'Inappropriate behavior',
  'Impersonation',
  'Hate or abusive behavior',
  'Scam or fraud',
  'Other',
];

export const ReportPlayerModal: React.FC<ReportPlayerModalProps> = ({
  reportedUserId,
  reportedName,
  reporterId,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await submitUserReport(reporterId, {
      reportedUserId,
      reportedName,
      reason: selectedReason,
      description: details,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    onShowToast(res.message);

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
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
        <div className="flex items-center justify-between border-b border-[#26242C] pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <span className="material-symbols-outlined text-lg">flag</span>
            <span>Report Player</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h4 className="text-base font-bold text-white">Report submitted</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Thank you for helping keep KAOS safe. Our moderation team will review this report confidentially.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0">
                🛡️
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{reportedName}</p>
                <p className="text-[10px] text-zinc-500 font-mono">Reporting Explorer Account</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                Why are you reporting this player?
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      selectedReason === reason
                        ? 'bg-[#F05423]/15 border border-[#F05423] text-white font-bold'
                        : 'bg-[#121114] border border-[#26242C] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedReason === reason && <span className="text-[#F05423] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                Optional Details
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide additional context to help our team review..."
                className="w-full bg-[#121114] border border-[#26242C] focus:border-[#F05423] rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#121114] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
