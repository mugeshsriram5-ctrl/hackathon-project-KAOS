import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to KAOS Grid',
      description: 'Your portal for immersive heritage exploration, spatial mapping, and interactive history.',
      icon: '🚀',
      badge: 'Step 1 of 4'
    },
    {
      title: 'Interactive Spatial Map',
      description: 'Discover historical temple tanks, heritage architecture, and live explorer nodes around you.',
      icon: '🗺️',
      badge: 'Step 2 of 4'
    },
    {
      title: 'KAOS Bot Intelligence',
      description: 'Chat with our advanced AI assistant for real-time historical insights, trivia, and tour guidance.',
      icon: '🤖',
      badge: 'Step 3 of 4'
    },
    {
      title: 'Quests & XP Rewards',
      description: 'Embark on daily exploration quests, earn experience points, and level up your Explorer badge.',
      icon: '⚡',
      badge: 'Step 4 of 4'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('kaos_onboarding_completed', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('kaos_onboarding_completed', 'true');
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1C1A1F] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#F05423]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#F05423]/10 text-[#F05423] border border-[#F05423]/20">
            {step.badge}
          </span>
          <button
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Skip Tour
          </button>
        </div>

        <div className="text-center space-y-6 my-4">
          <div className="w-20 h-20 rounded-2xl bg-[#121114] border border-white/10 flex items-center justify-center text-4xl mx-auto shadow-xl shadow-kaos-pink/10">
            {step.icon}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">{step.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {step.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 my-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[#F05423]' : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${currentStep > 0 ? 'w-2/3' : 'w-full'} py-3.5 rounded-2xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#F05423]/25 flex items-center justify-center gap-2 cursor-pointer`}
          >
            <span>{currentStep === steps.length - 1 ? 'Start Exploring' : 'Continue'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
