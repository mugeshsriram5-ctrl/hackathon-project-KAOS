import React from 'react';
import { motion } from 'framer-motion';
import { KaosAppIcon } from './KaosAppIcon';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background-primary flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-kaos-pink rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-kaos-purple rounded-full blur-[120px]"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-8 z-10"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
            }}
            transition={{ 
              duration: 2.2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="flex items-center justify-center"
          >
            <KaosAppIcon size={96} className="shadow-2xl shadow-kaos-pink/40" />
          </motion.div>
          
          {/* Decorative Cyber Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-14px] border border-dashed border-kaos-pink/20 rounded-full pointer-events-none"
          />
        </div>

        <div className="text-center space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-kaos-offwhite tracking-tighter uppercase italic">KAOS <span className="text-kaos-pink">Grid</span></h1>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-kaos-pink to-transparent mx-auto"></div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-kaos-pink uppercase tracking-[0.3em] animate-pulse">Establishing Link...</p>
            <p className="text-[9px] text-text-secondary uppercase tracking-widest opacity-50">Syncing Archaeological Data</p>
          </div>
        </div>

        {/* Progress Bar Mock */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-kaos-pink to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
};
