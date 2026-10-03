import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Squad {
  id: string;
  name: string;
  motto: string;
  sector: string;
  avatar: string;
  memberCount: number;
  totalXp: number;
  joined: boolean;
  accentColor: string; // Faction specific color mapping
}

interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  goalXp: number;
  currentXp: number;
  rewardXp: number;
  timeLeft: string;
}

interface SquadsScreenProps {
  onShowToast: (msg: string) => void;
  onAwardXp: (amount: number, reason: string) => void;
}

export const SquadsScreen: React.FC<SquadsScreenProps> = ({ onShowToast, onAwardXp }) => {
  const [activeTab, setActiveTab] = useState<'my-squad' | 'leaderboard' | 'challenges'>('my-squad');
  
  // Local list of interactive squads with design tokens mapped (Controlled Chaos style)
  const [squads, setSquads] = useState<Squad[]>([
    {
      id: 'squad-1',
      name: 'Mylapore Temple Tank Guild',
      motto: 'Deciphering ancient gopuram geometry & temple water soundscapes.',
      sector: 'Mylapore',
      avatar: '🏛️',
      memberCount: 14,
      totalXp: 18450,
      joined: true, // User starts inside this squad
      accentColor: 'text-kaos-teal border-kaos-teal',
    },
    {
      id: 'squad-2',
      name: 'Triplicane Peaberry Roasters',
      motto: 'Hunting 1920s secret filter coffee recipes & old coffee house ledgers.',
      sector: 'Triplicane',
      avatar: '☕',
      memberCount: 9,
      totalXp: 12200,
      joined: false,
      accentColor: 'text-kaos-orange border-kaos-orange',
    },
    {
      id: 'squad-3',
      name: 'Fort St. George Surveyors',
      motto: 'Unlocking hidden colonial map vaults & stained glass archives.',
      sector: 'George Town',
      avatar: '🧭',
      memberCount: 11,
      totalXp: 9800,
      joined: false,
      accentColor: 'text-kaos-blue border-kaos-blue',
    },
    {
      id: 'squad-4',
      name: 'Adyar Estuary Naturalists',
      motto: 'Mapping migratory nesting patterns & ancient coastal trails.',
      sector: 'Adyar',
      avatar: '🦅',
      memberCount: 6,
      totalXp: 6450,
      joined: false,
      accentColor: 'text-kaos-lime border-kaos-lime',
    },
  ]);

  // Squad Collaborative Challenges
  const [challenges, setChallenges] = useState<GroupChallenge[]>([
    {
      id: 'challenge-1',
      title: 'Mylapore Sacred Water Survey',
      description: 'Collaborate to record 10 geofenced acoustic check-ins at Kapaleeshwarar Tank.',
      goalXp: 5000,
      currentXp: 3800,
      rewardXp: 500,
      timeLeft: '2 days left',
    },
    {
      id: 'challenge-2',
      title: 'Triplicane Coffee House Archival',
      description: 'Collect photo proof of vintage brass peaberry coffee filters at traditional roasteries.',
      goalXp: 3000,
      currentXp: 1200,
      rewardXp: 350,
      timeLeft: '5 days left',
    },
    {
      id: 'challenge-3',
      title: 'Indo-Saracenic Vault Photo Raid',
      description: 'Upload 15 snapshots of grand high-vaulted columns at Senate House & Chepauk Palace.',
      goalXp: 8000,
      currentXp: 7400,
      rewardXp: 800,
      timeLeft: '12 hours left',
    },
  ]);

  // Form states for creating a new squad
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadMotto, setNewSquadMotto] = useState('');
  const [newSquadSector, setNewSquadSector] = useState('Mylapore');
  const [newSquadAvatar, setNewSquadAvatar] = useState('🛡️');

  const handleJoinSquad = (id: string) => {
    setSquads((prev) =>
      prev.map((sq) => {
        if (sq.id === id) {
          onShowToast(`Joined Squad: ${sq.name}! Welcome Explorer! 🛡️`);
          return { ...sq, joined: true, memberCount: sq.memberCount + 1 };
        }
        // Force single active squad for high fidelity simulation
        return { ...sq, joined: false, memberCount: sq.joined ? sq.memberCount - 1 : sq.memberCount };
      })
    );
  };

  const handleLeaveSquad = (id: string) => {
    setSquads((prev) =>
      prev.map((sq) => {
        if (sq.id === id) {
          onShowToast(`Left Squad: ${sq.name}`);
          return { ...sq, joined: false, memberCount: sq.memberCount - 1 };
        }
        return sq;
      })
    );
  };

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim() || !newSquadMotto.trim()) return;

    const newSq: Squad = {
      id: `squad-${Date.now()}`,
      name: newSquadName,
      motto: newSquadMotto,
      sector: newSquadSector,
      avatar: newSquadAvatar,
      memberCount: 1,
      totalXp: 300,
      joined: true,
      accentColor: 'text-kaos-pink border-kaos-pink',
    };

    setSquads((prev) => prev.map((s) => ({ ...s, joined: false, memberCount: s.joined ? s.memberCount - 1 : s.memberCount })).concat(newSq));
    onShowToast(`New Squad Created: ${newSquadName}! 🛡️`);
    setShowCreateModal(false);
    setNewSquadName('');
    setNewSquadMotto('');
    onAwardXp(100, 'Squad Founder Bonus');
  };

  const handleContributeChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const contributed = 400;
          const nextXp = Math.min(ch.goalXp, ch.currentXp + contributed);
          onAwardXp(50, `Contributed to ${ch.title}`);
          onShowToast(`Boosted Group Challenge by +${contributed} Progress XP! 🚀`);
          if (nextXp >= ch.goalXp && ch.currentXp < ch.goalXp) {
            onAwardXp(ch.rewardXp, `Squad Challenge Master: ${ch.title}`);
            onShowToast(`🎉 SQUAD TRIUMPH! Collaborative Challenge "${ch.title}" successfully completed!`);
          }
          return { ...ch, currentXp: nextXp };
        }
        return ch;
      })
    );
  };

  const activeSquad = squads.find((s) => s.joined);

  return (
    <div className="space-y-6 pb-28 p-4 md:p-8 max-w-6xl mx-auto font-sans text-kaos-offwhite selection:bg-kaos-teal/20">
      
      {/* Header Banner - Style C Hero Gradient */}
      <div className="bg-gradient-to-r from-kaos-teal to-kaos-purple rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-kaos-teal/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-kaos-yellow text-3xl animate-bounce">groups</span>
              <h2 className="text-xl md:text-2xl font-extrabold text-kaos-navy tracking-tight uppercase">KAOS Explorer Factions</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-kaos-navy text-kaos-teal text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-kaos-lime animate-ping" />
                <span>Squad System Active</span>
              </span>
            </div>
            <p className="text-xs text-kaos-navy/80 mt-1.5 font-semibold">
              Form local factions, join collaborative challenges, and conquer Chennai regional leaderboards!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-xl bg-kaos-navy hover:bg-kaos-purple text-kaos-teal hover:text-kaos-offwhite font-black text-xs flex items-center gap-2 shadow-lg transition-all self-start md:self-auto cursor-pointer border border-kaos-teal/30"
          >
            <span className="material-symbols-outlined text-sm font-bold">group_add</span>
            <span>Form New Squad</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs - Style B Color Wash */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-primary border border-progress-track rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('my-squad')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'my-squad'
              ? 'bg-kaos-teal text-kaos-navy shadow-lg font-extrabold'
              : 'text-text-secondary hover:text-kaos-offwhite'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          <span>My Squad</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'bg-kaos-pink text-kaos-offwhite shadow-lg font-extrabold'
              : 'text-text-secondary hover:text-kaos-offwhite'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">leaderboard</span>
          <span>XP Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'challenges'
              ? 'bg-kaos-orange text-kaos-offwhite shadow-lg font-extrabold'
              : 'text-text-secondary hover:text-kaos-offwhite'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">military_tech</span>
          <span>Group Challenges</span>
          <span className="w-4 h-4 rounded-full bg-kaos-yellow text-kaos-navy text-[9px] font-extrabold flex items-center justify-center">
            {challenges.filter((c) => c.currentXp < c.goalXp).length}
          </span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Middle Major Column */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* View Tab 1: My Squad */}
            {activeTab === 'my-squad' && (
              <motion.div
                key="my-squad"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {activeSquad ? (
                  <div className="bg-surface-primary border border-progress-track rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                    {/* Active Squad Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-progress-track pb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-kaos-teal to-kaos-purple flex items-center justify-center text-3xl shadow-lg shrink-0">
                          {activeSquad.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-kaos-teal uppercase tracking-tight">{activeSquad.name}</h3>
                            <span className="px-2.5 py-0.5 rounded-md bg-kaos-lime/15 border border-kaos-lime/40 text-kaos-lime text-[10px] font-mono font-bold">
                              ACTIVE MEMBER
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1.5 italic">"{activeSquad.motto}"</p>
                          <p className="text-[11px] font-mono text-kaos-teal mt-2 flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            <span>{activeSquad.sector} Regional Sector</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLeaveSquad(activeSquad.id)}
                        className="px-4 py-2 rounded-xl bg-transparent border border-kaos-red/40 text-kaos-red hover:text-kaos-offwhite hover:bg-kaos-red text-xs font-black transition-all shrink-0 cursor-pointer"
                      >
                        Leave Squad
                      </button>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-surface-secondary border border-progress-track text-center shadow-md">
                        <span className="text-xs text-text-secondary font-medium block">Total Members</span>
                        <span className="text-xl font-extrabold text-kaos-teal mt-0.5 block">{activeSquad.memberCount}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-secondary border border-progress-track text-center shadow-md">
                        <span className="text-xs text-text-secondary font-medium block">Squad XP</span>
                        <span className="text-xl font-extrabold text-kaos-yellow mt-0.5 block">{activeSquad.totalXp.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-secondary border border-progress-track text-center shadow-md">
                        <span className="text-xs text-text-secondary font-medium block">Global Rank</span>
                        <span className="text-xl font-extrabold text-kaos-lime mt-0.5 block">#1</span>
                      </div>
                    </div>

                    {/* Collaborative Achievements Checklist */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Squad Milestones</h4>
                      <div className="space-y-2">
                        {[
                          { title: 'The Madras Founders Stamp', desc: 'Achieved when squad reaches 10 members', completed: true, color: 'text-kaos-teal border-kaos-teal/30' },
                          { title: 'Supreme Cartographer Banner', desc: 'Squad total XP reaches 20,000 XP', completed: false, color: 'text-kaos-yellow border-kaos-yellow/30' },
                          { title: 'Elite Coffee Roastery Conquest', desc: 'Complete 3 Triplicane coffee challenges', completed: false, color: 'text-kaos-orange border-kaos-orange/30' },
                        ].map((m, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-surface-secondary border border-progress-track flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <p className="font-extrabold text-kaos-offwhite">{m.title}</p>
                              <p className="text-text-secondary text-[11px] mt-1">{m.desc}</p>
                            </div>
                            <span className={`material-symbols-outlined text-base font-bold shrink-0 ${m.completed ? 'text-kaos-lime' : 'text-text-muted'}`}>
                              {m.completed ? 'check_circle' : 'pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-primary border border-progress-track rounded-3xl p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto text-text-muted">
                      <span className="material-symbols-outlined text-3xl">shield</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-kaos-offwhite">You are not in a Squad</h3>
                      <p className="text-xs text-text-secondary max-w-sm mx-auto">
                        Connect with fellow cartographers to compete in regional XP boards and complete high-yield group challenges!
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          handleJoinSquad(squads[0].id);
                        }}
                        className="px-4 py-2 rounded-xl bg-kaos-teal text-kaos-navy text-xs font-black hover:opacity-95 shadow-lg cursor-pointer"
                      >
                        Join Mylapore Temple Tank Guild
                      </button>
                    </div>
                  </div>
                )}

                {/* Available squads explorer */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Discover Other Squads</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {squads.filter((s) => !s.joined).map((sq) => (
                      <div key={sq.id} className="bg-surface-primary border border-progress-track rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-progress-track flex items-center justify-center text-xl shrink-0">
                              {sq.avatar}
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-kaos-offwhite truncate max-w-[150px]">{sq.name}</h4>
                              <p className="text-[10px] text-kaos-teal font-mono flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">location_on</span>
                                <span>{sq.sector}</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed min-h-[32px]">{sq.motto}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-progress-track pt-3">
                          <span className="text-[10px] font-mono text-kaos-yellow font-bold">
                            {sq.totalXp.toLocaleString()} XP · {sq.memberCount} members
                          </span>
                          <button
                            onClick={() => handleJoinSquad(sq.id)}
                            className="px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-kaos-teal text-kaos-teal hover:text-kaos-navy border border-kaos-teal/30 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Join Squad
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* View Tab 2: XP Leaderboard */}
            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-surface-primary border border-progress-track rounded-3xl p-5 sm:p-7 shadow-xl space-y-5"
              >
                <div className="border-b border-progress-track pb-3">
                  <h3 className="text-sm font-extrabold text-kaos-pink uppercase tracking-wider">Factions Regional Leaderboard</h3>
                  <p className="text-xs text-text-secondary">Comparing total team effort and weekly XP milestones.</p>
                </div>

                <div className="space-y-2">
                  {squads.sort((a, b) => b.totalXp - a.totalXp).map((sq, idx) => {
                    const rank = idx + 1;
                    return (
                      <div
                        key={sq.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          sq.joined
                            ? 'bg-surface-secondary border-kaos-teal/40'
                            : 'bg-surface-primary border-progress-track'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg text-[10px] font-extrabold font-mono flex items-center justify-center shrink-0 ${
                            rank === 1 ? 'bg-kaos-yellow text-kaos-navy' : rank === 2 ? 'bg-text-secondary text-kaos-navy' : 'bg-surface-secondary text-text-secondary'
                          }`}>
                            #{rank}
                          </span>

                          <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-progress-track flex items-center justify-center text-lg shrink-0">
                            {sq.avatar}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-kaos-offwhite truncate flex items-center gap-1.5">
                              <span>{sq.name}</span>
                              {sq.joined && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-kaos-teal text-kaos-navy">
                                  YOUR SQUAD
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-text-secondary font-mono mt-1">
                              {sq.memberCount} active surveyors · {sq.sector}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-kaos-yellow">{sq.totalXp.toLocaleString()} XP</span>
                          <span className="text-[9px] text-text-secondary block">Level {Math.floor(sq.totalXp / 3000) + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* View Tab 3: Group Challenges */}
            {activeTab === 'challenges' && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {challenges.map((ch) => {
                  const percent = Math.round((ch.currentXp / ch.goalXp) * 100);
                  const isCompleted = ch.currentXp >= ch.goalXp;

                  return (
                    <div key={ch.id} className="bg-surface-primary border border-progress-track rounded-2xl p-5 space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-progress-track pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-kaos-orange text-lg">military_tech</span>
                            <h4 className="text-xs font-bold text-kaos-offwhite">{ch.title}</h4>
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-md bg-kaos-lime/10 border border-kaos-lime/30 text-kaos-lime text-[9px] font-mono font-bold">
                                COMPLETED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-secondary font-mono mt-1 flex items-center gap-1">
                            <span>⏱️ {ch.timeLeft}</span>
                            <span>·</span>
                            <span className="text-kaos-yellow font-bold">+{ch.rewardXp} XP Group Reward</span>
                          </p>
                        </div>

                        {!isCompleted && (
                          <button
                            onClick={() => handleContributeChallenge(ch.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-kaos-orange hover:bg-kaos-yellow text-kaos-offwhite hover:text-kaos-navy font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer transition-all shrink-0 hover:opacity-95"
                          >
                            <span className="material-symbols-outlined text-xs">upload</span>
                            <span>Upload Proof (+400 XP)</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed">{ch.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-text-secondary font-bold">COLLABORATIVE PROGRESS</span>
                          <span className={`${isCompleted ? 'text-kaos-lime' : 'text-kaos-orange'} font-bold`}>
                            {ch.currentXp.toLocaleString()} / {ch.goalXp.toLocaleString()} XP ({percent}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-surface-secondary border border-progress-track rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-kaos-lime' : 'bg-kaos-orange'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Side Info/Feed Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-primary border border-progress-track rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-kaos-teal">Collaborative Factions Intel</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every explorer checkout, validated AR photo evidence, and landmark check-in contributes points directly to your active squad.
            </p>
            <div className="p-3 bg-surface-secondary rounded-2xl border border-progress-track space-y-1.5 text-xs text-text-secondary">
              <span className="text-kaos-teal font-bold font-mono text-[10px] block">CHECK-IN MULTIPLIERS</span>
              <p>⏱️ Early Morning Trail checks: <span className="font-bold text-kaos-yellow">1.5x XP</span></p>
              <p>👥 Squad Multiplayer exploration: <span className="font-bold text-kaos-lime">2.0x XP</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Form Create Squad Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-kaos-navy/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-primary border border-progress-track rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-progress-track pb-3">
              <h3 className="text-base font-bold text-kaos-offwhite flex items-center gap-2">
                <span className="material-symbols-outlined text-kaos-teal">group_add</span>
                <span>Form New Explorer Squad</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-kaos-offwhite cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary uppercase font-bold">Squad Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madras Lighthouse Raiders"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full bg-surface-secondary border border-progress-track focus:border-kaos-teal rounded-xl px-3 py-2.5 text-xs text-kaos-offwhite focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary uppercase font-bold">Squad Bio & Motto</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What is your squad's primary mission in Chennai?"
                  value={newSquadMotto}
                  onChange={(e) => setNewSquadMotto(e.target.value)}
                  className="w-full bg-surface-secondary border border-progress-track focus:border-kaos-teal rounded-xl px-3 py-2.5 text-xs text-kaos-offwhite focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Squad Sector</label>
                  <select
                    value={newSquadSector}
                    onChange={(e) => setNewSquadSector(e.target.value)}
                    className="w-full bg-surface-secondary border border-progress-track focus:border-kaos-teal rounded-xl px-3 py-2 text-xs text-kaos-offwhite focus:outline-none"
                  >
                    <option value="Mylapore">Mylapore</option>
                    <option value="Triplicane">Triplicane</option>
                    <option value="George Town">George Town</option>
                    <option value="Chepauk">Chepauk</option>
                    <option value="Adyar">Adyar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Badge Icon</label>
                  <select
                    value={newSquadAvatar}
                    onChange={(e) => setNewSquadAvatar(e.target.value)}
                    className="w-full bg-surface-secondary border border-progress-track focus:border-kaos-teal rounded-xl px-3 py-2 text-xs text-kaos-offwhite focus:outline-none"
                  >
                    <option value="🛡️">🛡️ Shield</option>
                    <option value="🏛️">🏛️ Temple</option>
                    <option value="☕">☕ Coffee</option>
                    <option value="🧭">🧭 Compass</option>
                    <option value="🐯">🐯 Tiger</option>
                    <option value="🦅">🦅 Eagle</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-secondary border border-progress-track text-text-secondary hover:text-kaos-offwhite font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-kaos-teal text-kaos-navy font-bold cursor-pointer hover:opacity-95 shadow-md"
                >
                  Form Squad (+100 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SquadsScreen;
