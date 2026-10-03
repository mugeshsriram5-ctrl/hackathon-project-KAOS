import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 font-sans select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 bg-[#1C1A1F] border-t border-[#26242C] rounded-t-3xl max-h-[88vh] flex flex-col max-w-xl mx-auto shadow-2xl overflow-hidden pb-safe"
          >
            {/* Grab Handle */}
            <div className="w-full py-2.5 flex items-center justify-center cursor-pointer shrink-0" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-zinc-600/60" />
            </div>

            {/* Optional Title Header */}
            {(title || subtitle) && (
              <div className="px-6 pb-3 border-b border-[#26242C] flex items-center justify-between shrink-0">
                <div>
                  {title && <h3 className="text-base font-extrabold text-white tracking-tight">{title}</h3>}
                  {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#121114] border border-[#26242C] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-4 scrollbar-thin flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
