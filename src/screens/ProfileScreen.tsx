import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, performSecureSignOut } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { KAOS_STAMPS, KAOS_PERKS } from '../data/kaosData';
import { sqlDb } from '../lib/sqlDatabase';
import { GlobalExplorers } from '../components/GlobalExplorers';
import { MasterSpot } from '../types';
import { validateHandle } from '../utils/handleValidation';
import { fetchBlockedUsers, unblockUser, BlockRecord, getActiveUserId } from '../services/socialService';
import { KaosAppIcon } from '../components/KaosAppIcon';
import { AVAILABLE_INTERESTS, PRESET_AVATARS, UserProfileData } from '../components/EditProfileModal';

interface ProfileScreenProps {
  onShowToast: (msg: string) => void;
  onSpotSelected?: (spot: MasterSpot) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onShowToast,
  onSpotSelected,
}) => {
  const [stats, setStats] = useState(() => sqlDb.getExplorerStats());
  const [savedPlaces, setSavedPlaces] = useState<MasterSpot[]>(() =>
    sqlDb.getSavedPlaces()
  );

  const [profile, setProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem('kaos_user_full_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      displayName: 'Usha Baskar',
      username: 'usha_explorer',
      bio: 'Chennai heritage explorer & cartographer',
      avatar: '🛡️',
      availabilityStatus: 'Available Now',
      interests: ['Heritage', 'Architecture', 'Temple Tanks'],
    };
  });
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'edit' | 'favorites' | 'stamps'>('overview');
  const [pendingTab, setPendingTab] = useState<'overview' | 'edit' | 'favorites' | 'stamps' | null>(null);
  const [pendingGlobalTab, setPendingGlobalTab] = useState<string | null>(null);

  // Local Form state for Edit Profile
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName || '');
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [editUsername, setEditUsername] = useState(profile.username || '');
  const [editAvatar, setEditAvatar] = useState(profile.avatar || '🛡️');
  const [editStatus, setEditStatus] = useState(profile.availabilityStatus || 'Available Now');
  const [editInterests, setEditInterests] = useState<string[]>(profile.interests || ['Heritage', 'Architecture']);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    username?: string;
    bio?: string;
  }>({});
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Field element refs for scroll-to-error on mobile
  const displayNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit form fields when profile is loaded
  useEffect(() => {
    setEditDisplayName(profile.displayName || '');
    setEditBio(profile.bio || '');
    setEditUsername(profile.username || '');
    setEditAvatar(profile.avatar || '🛡️');
    setEditStatus(profile.availabilityStatus || 'Available Now');
    setEditInterests(profile.interests || ['Heritage', 'Architecture']);
  }, [profile]);
  
  // Custom Trail creator popup state
  const [trailPopupOpen, setTrailCreatorOpen] = useState(false);
  const [trailName, setTrailName] = useState('');
  const [trailZone, setTrailZone] = useState('Mylapore');
  const [trailMins, setTrailMins] = useState(60);

  const refreshProfileData = () => {
    setStats(sqlDb.getExplorerStats());
    setSavedPlaces(sqlDb.getSavedPlaces());
  };

  useEffect(() => {
    refreshProfileData();

    async function loadFirestoreProfile() {
      if (!auth.currentUser) return;
      try {
        const userId = auth.currentUser.uid;
        const docRef = doc(db, 'users', userId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const loadedProfile = {
            displayName: data.displayName || data.name || auth.currentUser.displayName || profile.displayName,
            username: data.username || profile.username,
            bio: data.bio || profile.bio,
            avatar: data.avatar || profile.avatar,
            availabilityStatus: data.availabilityStatus || profile.availabilityStatus,
            interests: Array.isArray(data.interests) ? data.interests : (profile.interests || ['Heritage', 'Architecture']),
          };
          setProfile(loadedProfile);
        } else {
          // If no doc exists yet, use auth data
          const initialProfile = {
            ...profile,
            displayName: auth.currentUser.displayName || profile.displayName,
            username: auth.currentUser.email?.split('@')[0] || profile.username,
          };
          setProfile(initialProfile);
          // Auto-persist initial profile to Firestore
          await setDoc(docRef, {
            ...initialProfile,
            email: auth.currentUser.email,
            uid: userId,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Firestore profile fetch notice:', err);
      }
    }
    loadFirestoreProfile();

    // Re-trigger updates on storage syncing or favoriting
    const handleSavedChange = () => {
      refreshProfileData();
    };

    window.addEventListener('kaos-spot-saved-change', handleSavedChange);
    window.addEventListener('kaos-adventures-updated', handleSavedChange);
    return () => {
      window.removeEventListener('kaos-spot-saved-change', handleSavedChange);
      window.removeEventListener('kaos-adventures-updated', handleSavedChange);
    };
  }, []);

  const handleCopyCode = (code: string, perkName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    onShowToast(`Copied code "${code}" for ${perkName}! 🎁`);
  };

  // Simple, Consumer-facing progress backups (underneath it runs SQL snapshot dumps!)
  const handleBackupProgress = () => {
    try {
      const info = sqlDb.downloadBackupFile();
      onShowToast(`Backup file created: "${info.filename}" (${info.recordsCount} records) 💾`);
    } catch {
      onShowToast('Could not create progress backup.');
    }
  };

  const handleImportProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = sqlDb.restoreDatabaseJson(json);
        if (res.success) {
          onShowToast('Progress successfully restored! ❤️');
          refreshProfileData();
        } else {
          onShowToast(`Failed to restore backup: ${res.message}`);
        }
      } catch {
        onShowToast('Invalid backup file selected.');
      }
    };
    reader.readAsText(file);
  };

  // Handle removing a saved spot from the profile tab
  const handleRemoveSaved = (e: React.MouseEvent, spotId: string) => {
    e.stopPropagation();
    sqlDb.toggleSavePlace(spotId);
    onShowToast('Removed from saved places.');
    refreshProfileData();
  };

  // Create a Custom Trail (underneath seeds SQL adventures)
  const handleCreateTrailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trailName.trim()) {
      onShowToast('Please enter a trail name.');
      return;
    }
    
    const stopsCount = Math.floor(3 + Math.random() * 3);
    const distanceKm = parseFloat((2.0 + Math.random() * 3.5).toFixed(1));
    const xpReward = stopsCount * 50 + 100;

    sqlDb.createCustomTrail(
      trailName.trim(),
      trailZone,
      trailMins,
      distanceKm,
      stopsCount,
      xpReward
    );

    onShowToast(`Custom Trail "${trailName}" successfully saved to your index! 🧭`);
    setTrailName('');
    setTrailCreatorOpen(false);
    refreshProfileData();
  };

  const [blockedList, setBlockedList] = useState<BlockRecord[]>([]);

  useEffect(() => {
    async function loadBlocked() {
      const list = await fetchBlockedUsers(getActiveUserId());
      setBlockedList(list);
    }
    loadBlocked();
  }, []);

  // Compute unsaved changes in local state
  const isNameChanged = editDisplayName.trim() !== (profile.displayName || '').trim();
  const isBioChanged = editBio.trim() !== (profile.bio || '').trim();
  const isUsernameChanged = editUsername.trim().toLowerCase() !== (profile.username || '').trim().toLowerCase();
  const isAvatarChanged = editAvatar !== (profile.avatar || '🛡️');
  const isStatusChanged = editStatus !== (profile.availabilityStatus || 'Available Now');
  const areInterestsChanged = (() => {
    const orig = profile.interests || [];
    if (editInterests.length !== orig.length) return true;
    const sortedA = [...editInterests].sort();
    const sortedB = [...orig].sort();
    return sortedA.some((val, idx) => val !== sortedB[idx]);
  })();

  const hasUnsavedChanges =
    isNameChanged ||
    isBioChanged ||
    isUsernameChanged ||
    isAvatarChanged ||
    isStatusChanged ||
    areInterestsChanged;

  const changedFieldsList: string[] = [];
  if (isNameChanged) changedFieldsList.push('Display Name');
  if (isUsernameChanged) changedFieldsList.push('Handle');
  if (isAvatarChanged) changedFieldsList.push('Avatar');
  if (isBioChanged) changedFieldsList.push('Bio');
  if (isStatusChanged) changedFieldsList.push('Status');
  if (areInterestsChanged) changedFieldsList.push('Interests');

  // Warn on browser / window close if editing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSubTab === 'edit' && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSubTab, hasUnsavedChanges]);

  // Intercept global tab navigation when unsaved changes exist
  useEffect(() => {
    const handleGlobalNav = (e: any) => {
      if (activeSubTab === 'edit' && hasUnsavedChanges) {
        e.preventDefault();
        setPendingGlobalTab(e.detail?.targetTab || null);
        setShowUnsavedConfirm(true);
      }
    };
    window.addEventListener('kaos-navigate-away-from-profile', handleGlobalNav);
    return () => {
      window.removeEventListener('kaos-navigate-away-from-profile', handleGlobalNav);
    };
  }, [activeSubTab, hasUnsavedChanges]);

  // Tab switching with unsaved changes protection
  const handleTabSwitch = (targetTab: 'overview' | 'edit' | 'favorites' | 'stamps') => {
    if (activeSubTab === 'edit' && targetTab !== 'edit' && hasUnsavedChanges) {
      setPendingTab(targetTab);
      setShowUnsavedConfirm(true);
      return;
    }
    setActiveSubTab(targetTab);
  };

  // Discard changes
  const handleDiscardChanges = () => {
    setEditDisplayName(profile.displayName || '');
    setEditBio(profile.bio || '');
    setEditUsername(profile.username || '');
    setEditAvatar(profile.avatar || '🛡️');
    setEditStatus(profile.availabilityStatus || 'Available Now');
    setEditInterests(profile.interests || ['Heritage', 'Architecture', 'Temple Tanks']);
    setValidationErrors({});
    setSaveError(null);
    setShowUnsavedConfirm(false);

    if (pendingGlobalTab) {
      const tabToSwitch = pendingGlobalTab;
      setPendingGlobalTab(null);
      window.dispatchEvent(new CustomEvent('kaos-switch-tab', { detail: tabToSwitch }));
      return;
    }

    if (pendingTab) {
      setActiveSubTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleSaveProfile = async (targetTabAfterSave?: 'overview' | 'edit' | 'favorites' | 'stamps'): Promise<boolean> => {
    setSaveError(null);

    // Validate fields
    const errors: { displayName?: string; username?: string; bio?: string } = {};

    if (!editDisplayName.trim()) {
      errors.displayName = 'Display Name is required.';
    } else if (editDisplayName.trim().length > 50) {
      errors.displayName = 'Display Name must be 50 characters or fewer.';
    }

    const handleCheck = validateHandle(editUsername);
    if (!handleCheck.isValid) {
      errors.username = handleCheck.error || 'Please enter a valid handle.';
    }

    if (editBio.length > 300) {
      errors.bio = 'Bio cannot exceed 300 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      onShowToast('Please fix the highlighted errors before saving.');
      if (errors.displayName && displayNameRef.current) {
        displayNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        displayNameRef.current.focus();
      } else if (errors.username && usernameRef.current) {
        usernameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        usernameRef.current.focus();
      } else if (errors.bio && bioRef.current) {
        bioRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bioRef.current.focus();
      }
      return false;
    }

    setValidationErrors({});
    setIsSaving(true);

    const updated: UserProfileData = {
      displayName: editDisplayName.trim(),
      username: handleCheck.normalizedHandle,
      bio: editBio.trim(),
      avatar: editAvatar || '🛡️',
      availabilityStatus: editStatus,
      interests: editInterests,
    };

    try {
      setProfile(updated);
      try {
        localStorage.setItem('kaos_user_full_profile', JSON.stringify(updated));
      } catch {}

      // Dispatch event so any open headers / cards update immediately
      window.dispatchEvent(new CustomEvent('kaos-profile-updated', { detail: updated }));

      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(
          userDocRef,
          {
            displayName: updated.displayName,
            name: updated.displayName,
            username: updated.username,
            bio: updated.bio,
            avatar: updated.avatar,
            availabilityStatus: updated.availabilityStatus,
            interests: updated.interests,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setSaveSuccess(true);
      onShowToast('Changes saved successfully! ✨');
      setTimeout(() => setSaveSuccess(false), 2500);

      setShowUnsavedConfirm(false);

      if (pendingGlobalTab) {
        const tabToSwitch = pendingGlobalTab;
        setPendingGlobalTab(null);
        window.dispatchEvent(new CustomEvent('kaos-switch-tab', { detail: tabToSwitch }));
        return true;
      }

      if (targetTabAfterSave) {
        setActiveSubTab(targetTabAfterSave);
        setPendingTab(null);
      }
      return true;
    } catch (err: any) {
      console.warn('Profile save sync notice:', err);
      setSaveError("Couldn't save your changes. Please try again.");
      onShowToast("Couldn't save your changes. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const currentLevel = Math.floor((stats?.xp || 1420) / 300) + 1;

  const handleSignOut = async () => {
    try {
      await performSecureSignOut();
    } catch (err) {
      onShowToast('Failed to disconnect signal. Please try again.');
      setShowSignOutConfirm(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Profile Overview Card */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#121114] flex items-center justify-center text-3xl shadow-xl shadow-kaos-pink/20 shrink-0 overflow-hidden border border-white/10">
                {profile.avatar && (profile.avatar.startsWith('data:') || profile.avatar.startsWith('http') || profile.avatar.includes('svg')) ? (
                  <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.avatar || '🛡️'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 pointer-events-none">
                <KaosAppIcon size={20} withGlow={false} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{profile.displayName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F05423]/20 text-[#F05423]">
                  Level {currentLevel} Cartographer
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {profile.availabilityStatus}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-[#F05423] mt-0.5">
                @{profile.username.replace(/^@/, '')}
              </p>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
              {profile.interests && profile.interests.length > 0 && (
                <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
                  <span className="text-amber-400 font-bold">✨ Interests:</span>
                  <span>{profile.interests.join(' · ')}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTabSwitch('edit')}
              className="px-3.5 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-[#F05423]/25"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit Profile</span>
              {hasUnsavedChanges && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-rose-500/10 border border-[#26242C] text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t border-[#26242C]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupProgress}
              className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all"
              title="Download local progress backup"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Backup</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
              <span className="material-symbols-outlined text-[16px]">upload</span>
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportProgress}
                className="hidden"
              />
            </label>
          </div>

          {/* Tabular Stats Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="p-3 md:px-5 md:py-3.5 rounded-2xl bg-[#121114] border border-[#26242C] text-center min-w-[80px]">
              <p className="text-lg md:text-xl font-bold text-[#F05423] tabular-nums font-mono">
                {(stats?.xp || 1420).toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total XP</p>
            </div>
            <div className="p-3 md:px-5 md:py-3.5 rounded-2xl bg-[#121114] border border-[#26242C] text-center min-w-[80px]">
              <p className="text-lg md:text-xl font-bold text-amber-400 tabular-nums font-mono">
                {stats?.stamps_count || KAOS_STAMPS.filter((s) => s.unlocked).length}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Stamps</p>
            </div>
            <div className="p-3 md:px-5 md:py-3.5 rounded-2xl bg-[#121114] border border-[#26242C] text-center min-w-[80px]">
              <p className="text-lg md:text-xl font-bold text-emerald-400 tabular-nums font-mono">
                {savedPlaces.length}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#26242C]">
        {[
          { id: 'overview', label: 'Overview', icon: 'person' },
          { id: 'edit', label: 'Edit Profile', icon: 'edit' },
          { id: 'favorites', label: 'Favorites', icon: 'favorite' },
          { id: 'stamps', label: 'Archive', icon: 'inventory_2' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabSwitch(tab.id as any)}
            className={`px-4 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2 border-b-2 ${
              activeSubTab === tab.id
                ? 'border-[#F05423] text-[#F05423] bg-[#F05423]/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'edit' && hasUnsavedChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Global Explorers Leaderboard Component */}
            <GlobalExplorers onShowToast={onShowToast} />

            {/* Privacy & Safety Settings Section (Moved to bottom of overview) */}
            <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-[#26242C] pb-3">
                <span className="material-symbols-outlined text-[#F05423] text-lg">shield</span>
                <div>
                  <h3 className="text-base font-bold text-white">Privacy & Safety</h3>
                  <p className="text-xs text-zinc-400">Manage blocked players and social interaction safety controls</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono text-zinc-400 uppercase font-bold">Blocked Users ({blockedList.length})</h4>
                {blockedList.length === 0 ? (
                  <p className="text-xs text-zinc-500 bg-[#121114] border border-[#26242C] p-4 rounded-2xl text-center">
                    You haven't blocked any players.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {blockedList.map((block) => (
                      <div
                        key={block.id}
                        className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0">
                            {block.blockedAvatar || '🛡️'}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{block.blockedName || 'Blocked Explorer'}</h5>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">@{block.blockedUsername || 'blocked'}</p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            await unblockUser(getActiveUserId(), block.blockedUserId);
                            setBlockedList((prev) => prev.filter((b) => b.blockedUserId !== block.blockedUserId));
                            onShowToast('Unblocked user. Friendship is not automatically restored.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Sub-Tab Screen Experience */}
        {activeSubTab === 'edit' && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26242C] pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F05423]/10 border border-[#F05423]/30 flex items-center justify-center text-[#F05423] shrink-0">
                    <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">Edit Profile</h2>
                      {hasUnsavedChanges ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{changedFieldsList.length} Unsaved</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check</span>
                          <span>Up to date</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Update your public identity, display name, bio, and explorer preferences
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('overview')}
                    className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>Back to Profile</span>
                  </button>
                </div>
              </div>

              {/* Error Banner if Save Failed */}
              {saveError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-rose-400">error</span>
                    <span className="font-medium">{saveError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="px-3 py-1 bg-rose-500 text-white rounded-xl font-bold text-xs hover:bg-rose-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile();
                }}
                className="space-y-6"
              >
                {/* 1. Explorer Identity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-[#26242C]/60">
                    <span className="text-[11px] font-mono uppercase font-bold text-[#F05423] tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>1. Explorer Identity</span>
                    </span>
                    {isNameChanged || isUsernameChanged ? (
                      <span className="text-[10px] text-amber-400 font-mono font-medium">Modified</span>
                    ) : null}
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-displayName" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Display Name <span className="text-[#F05423]">*</span></span>
                      <span className="text-[10px] text-zinc-500">{editDisplayName.length}/50</span>
                    </label>
                    <input
                      id="edit-displayName"
                      ref={displayNameRef}
                      type="text"
                      maxLength={50}
                      required
                      value={editDisplayName}
                      onChange={(e) => {
                        setEditDisplayName(e.target.value);
                        if (validationErrors.displayName) {
                          setValidationErrors((prev) => ({ ...prev, displayName: undefined }));
                        }
                      }}
                      placeholder="e.g. Usha Baskar"
                      className={`w-full bg-[#121114] border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all ${
                        validationErrors.displayName
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : isNameChanged
                          ? 'border-amber-500/60 focus:border-[#F05423]'
                          : 'border-[#26242C] focus:border-[#F05423]'
                      }`}
                    />
                    {validationErrors.displayName && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5">
                        <span className="material-symbols-outlined text-xs">error</span>
                        <span>{validationErrors.displayName}</span>
                      </p>
                    )}
                  </div>

                  {/* Handle Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-username" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Explorer Handle (@username) <span className="text-[#F05423]">*</span></span>
                      <span className="text-[10px] text-zinc-500">Lowercase letters, numbers, underscores</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-500 font-mono text-sm font-bold select-none">@</span>
                      <input
                        id="edit-username"
                        ref={usernameRef}
                        type="text"
                        maxLength={25}
                        required
                        value={editUsername}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setEditUsername(raw);
                          const check = validateHandle(raw);
                          if (!check.isValid) {
                            setValidationErrors((prev) => ({ ...prev, username: check.error }));
                          } else {
                            setValidationErrors((prev) => ({ ...prev, username: undefined }));
                          }
                        }}
                        placeholder="usha_explorer"
                        className={`w-full bg-[#121114] border rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none transition-all ${
                          validationErrors.username
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : isUsernameChanged
                            ? 'border-amber-500/60 focus:border-[#F05423]'
                            : 'border-[#26242C] focus:border-[#F05423]'
                        }`}
                      />
                    </div>
                    {validationErrors.username && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5">
                        <span className="material-symbols-outlined text-xs">error</span>
                        <span>{validationErrors.username}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Avatar & Portrait */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-[#26242C]/60">
                    <span className="text-[11px] font-mono uppercase font-bold text-[#F05423] tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">account_circle</span>
                      <span>2. Avatar & Portrait</span>
                    </span>
                    {isAvatarChanged ? (
                      <span className="text-[10px] text-amber-400 font-mono font-medium">Modified</span>
                    ) : null}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#121114] border border-[#26242C]">
                    <div className="w-20 h-20 rounded-2xl bg-[#1C1A1F] border-2 border-[#26242C] flex items-center justify-center text-4xl overflow-hidden shrink-0 shadow-lg relative">
                      {editAvatar && (editAvatar.startsWith('data:') || editAvatar.startsWith('http') || editAvatar.includes('svg')) ? (
                        <img src={editAvatar} alt="Current avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{editAvatar || '🛡️'}</span>
                      )}
                      {isAvatarChanged && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#1C1A1F]" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <label className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] active:bg-[#2e2c35] border border-[#26242C] text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-base text-[#F05423]">add_photo_alternate</span>
                        <span>Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditAvatar(reader.result as string);
                                onShowToast('Loaded new custom profile photo preview! 📸');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-zinc-400 text-center sm:text-left">
                        Supports JPG, PNG, WebP or choose from explorer badges below
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium">Or select an explorer badge:</span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-thin touch-pan-x">
                      {PRESET_AVATARS.map((preset, idx) => {
                        const isSelected = editAvatar === preset;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditAvatar(preset)}
                            className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border flex items-center justify-center overflow-hidden transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? 'border-[#F05423] ring-2 ring-[#F05423]/50 bg-[#F05423]/10 scale-105'
                                : 'border-[#26242C] bg-[#121114] hover:border-zinc-500'
                            }`}
                          >
                            {preset.startsWith('http') || preset.startsWith('/') ? (
                              <img src={preset} alt="preset badge" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl select-none">{preset}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Status & Lore Bio */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-[#26242C]/60">
                    <span className="text-[11px] font-mono uppercase font-bold text-[#F05423] tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                      <span>3. Status & Lore Bio</span>
                    </span>
                    {isStatusChanged || isBioChanged ? (
                      <span className="text-[10px] text-amber-400 font-mono font-medium">Modified</span>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-status" className="text-xs font-semibold text-zinc-300">
                      Current Expedition Status
                    </label>
                    <div className="relative">
                      <select
                        id="edit-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className={`w-full bg-[#121114] border rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none transition-all cursor-pointer appearance-none ${
                          isStatusChanged ? 'border-amber-500/60 focus:border-[#F05423]' : 'border-[#26242C] focus:border-[#F05423]'
                        }`}
                      >
                        <option value="Available Now">🟢 Available Now — Ready for live expeditions</option>
                        <option value="Exploring">🧭 Exploring — Currently in the field</option>
                        <option value="Away">🌙 Away — Transmitting from archive</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-3.5 text-zinc-400 pointer-events-none text-base">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Bio Textarea */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-bio" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Explorer Biography</span>
                      <span className={`text-[10px] ${editBio.length > 280 ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                        {editBio.length}/300
                      </span>
                    </label>
                    <textarea
                      id="edit-bio"
                      ref={bioRef}
                      rows={3}
                      maxLength={300}
                      value={editBio}
                      onChange={(e) => {
                        setEditBio(e.target.value);
                        if (validationErrors.bio) {
                          setValidationErrors((prev) => ({ ...prev, bio: undefined }));
                        }
                      }}
                      placeholder="Share your heritage specialties, favorite sectors, or expedition goals..."
                      className={`w-full bg-[#121114] border rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-all ${
                        validationErrors.bio
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : isBioChanged
                          ? 'border-amber-500/60 focus:border-[#F05423]'
                          : 'border-[#26242C] focus:border-[#F05423]'
                      }`}
                    />
                    {validationErrors.bio && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5">
                        <span className="material-symbols-outlined text-xs">error</span>
                        <span>{validationErrors.bio}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Explorer Interests */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#26242C]/60">
                    <span className="text-[11px] font-mono uppercase font-bold text-[#F05423] tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">interests</span>
                      <span>4. Heritage Lore Interests</span>
                    </span>
                    {areInterestsChanged ? (
                      <span className="text-[10px] text-amber-400 font-mono font-medium">Modified</span>
                    ) : null}
                  </div>

                  <p className="text-xs text-zinc-400">
                    Select topics you are passionate about to personalize your squad and map quests:
                  </p>

                  <div className="flex flex-wrap gap-2 p-3 bg-[#121114] border border-[#26242C] rounded-2xl">
                    {AVAILABLE_INTERESTS.map((interest) => {
                      const isSelected = editInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            setEditInterests((prev) =>
                              isSelected ? prev.filter((i) => i !== interest) : [...prev, interest]
                            );
                          }}
                          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 select-none ${
                            isSelected
                              ? 'bg-[#F05423] text-white border border-[#F05423] shadow-md shadow-[#F05423]/20'
                              : 'bg-[#1C1A1F] text-zinc-300 border border-[#26242C] hover:border-zinc-500 hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isSelected ? 'check' : 'add'}
                          </span>
                          <span>{interest}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Changes Footer inside Card */}
                <div className="pt-6 border-t border-[#26242C] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                    {hasUnsavedChanges ? (
                      <p className="text-xs text-amber-400 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Unsaved changes in: {changedFieldsList.join(', ')}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                        <span>All profile data is current</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleDiscardChanges}
                        className="flex-1 sm:flex-none min-h-[48px] px-4 py-3 rounded-xl bg-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Discard
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleTabSwitch('overview')}
                      className="flex-1 sm:flex-none min-h-[48px] px-5 py-3 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={!hasUnsavedChanges || isSaving}
                      className={`flex-1 sm:flex-none min-h-[48px] px-7 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        saveSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : hasUnsavedChanges && !isSaving
                          ? 'bg-[#F05423] hover:bg-[#ff6a38] active:bg-[#db4818] text-white shadow-[#F05423]/30 hover:scale-[1.02]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          <span>Saving Changes…</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <span className="material-symbols-outlined text-sm">done_all</span>
                          <span>Changes Saved!</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeSubTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#26242C] pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-500">favorite</span>
                  <span>My Favorites</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Archived heritage landmarks for your next expedition</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full font-bold">
                  {savedPlaces.length} Spots Locked
                </span>
              </div>
            </div>

            {/* List of Saved Places */}
            {savedPlaces.length === 0 ? (
              <div className="py-20 text-center rounded-3xl bg-[#1C1A1F] border border-dashed border-[#26242C] text-zinc-500">
                <span className="material-symbols-outlined text-5xl text-zinc-700 block mb-4">favorite_border</span>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No Favorites Synchronized</p>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs mx-auto">Tap the heart icon on any landmark dossier to archive it in your personal heritage grid.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlaces.map((spot) => (
                  <motion.div
                    key={spot.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onSpotSelected?.(spot)}
                    className="bg-[#1C1A1F] border border-[#26242C] hover:border-rose-500/40 rounded-3xl overflow-hidden cursor-pointer group transition-all shadow-lg hover:shadow-rose-500/5"
                  >
                    <div className="relative h-32 w-full">
                      <img
                        src={spot.imageUrl}
                        alt={spot.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A1F] to-transparent opacity-60" />
                      <button
                        onClick={(e) => handleRemoveSaved(e, spot.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                        title="Remove from Favorites"
                      >
                        <span className="material-symbols-outlined text-sm">favorite</span>
                      </button>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="text-xs font-black text-white group-hover:text-rose-400 transition-colors truncate uppercase tracking-tight">
                        {spot.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{spot.zone} · {spot.category}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                        <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                          <span className="material-symbols-outlined text-[10px]">speed</span>
                          <span>{spot.duration}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.lat && spot.lng) {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, '_blank');
                            }
                          }}
                          className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-tighter text-zinc-300 transition-all border border-white/5"
                        >
                          Navigate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'stamps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[#26242C] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-400">history_edu</span>
                    <span>Stamps & Trails</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Your documented history across the Chennai corridor</p>
                </div>
                <button
                  onClick={() => setTrailCreatorOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#F05423]/10 hover:bg-[#F05423]/20 border border-[#F05423]/40 text-[#F05423] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">hiking</span>
                  <span>Create Trail</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {KAOS_STAMPS.map((stamp) => (
                  <div
                    key={stamp.id}
                    onClick={() =>
                      onShowToast(`${stamp.title} (${stamp.rarity}) — ${stamp.description}`)
                    }
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-3.5 items-center ${
                      stamp.unlocked
                        ? 'bg-[#1C1A1F] border-[#26242C] hover:border-[#F05423]/50 shadow-lg'
                        : 'bg-[#121114]/50 border-[#26242C]/40 opacity-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-center text-2xl shrink-0">
                      {stamp.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white truncate uppercase tracking-tighter">{stamp.title}</h4>
                        <span className="text-[8px] text-amber-400 font-black uppercase bg-amber-400/10 px-1.5 py-0.5 rounded">{stamp.rarity}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 font-medium uppercase tracking-tight">{stamp.description}</p>
                      <p className="text-[9px] font-mono text-[#F05423] mt-1 tabular-nums font-bold">
                        +{stamp.xpValue} XP · {stamp.zone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#26242C] pb-3">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-400">redeem</span>
                  <span>Secret Vouchers</span>
                </h3>
                <span className="text-xs text-amber-400 font-semibold">Active Perks</span>
              </div>

              <div className="space-y-3">
                {KAOS_PERKS.map((perk) => (
                  <div
                    key={perk.id}
                    className="bg-gradient-to-br from-[#1C1A1F] to-[#26242C] border border-amber-500/30 rounded-3xl p-5 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold uppercase">{perk.zone}</span>
                      <span className="text-zinc-300 font-semibold">{perk.perkValue}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{perk.placeName}</h4>
                      <p className="text-xs text-zinc-300 mt-0.5">{perk.perkTitle}</p>
                      <p className="text-[11px] text-zinc-400 italic mt-0.5">"{perk.secretMenuDish}"</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/60 border border-[#26242C] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">Secret Code</p>
                        <p className="text-xs font-mono font-bold text-[#F05423] truncate">
                          {perk.secretCode}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyCode(perk.secretCode, perk.placeName)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simplified Custom Trail Builder Modal/Popup */}
      {trailPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1C1A1F] border border-[#26242C] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#F05423]">hiking</span>
                <span>Create Custom Trail</span>
              </h3>
              <button
                onClick={() => setTrailCreatorOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Design a personalized discovery walk in Chennai. Your trail will be synthesized and recorded inside your active missions index!
            </p>

            <form onSubmit={handleCreateTrailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Trail Name</label>
                <input
                  type="text"
                  required
                  value={trailName}
                  onChange={(e) => setTrailName(e.target.value)}
                  placeholder="e.g. Traditional Food Walk, Mylapore Sunset Trail"
                  className="w-full bg-[#121114] border border-[#26242C] focus:border-[#F05423] rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Zone Sector</label>
                  <select
                    value={trailZone}
                    onChange={(e) => setTrailZone(e.target.value)}
                    className="w-full bg-[#121114] border border-[#26242C] focus:border-[#F05423] rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="Mylapore">Mylapore</option>
                    <option value="Chepauk">Chepauk</option>
                    <option value="George Town">George Town</option>
                    <option value="Triplicane">Triplicane</option>
                    <option value="Besant Nagar">Besant Nagar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Duration (Mins)</label>
                  <select
                    value={trailMins}
                    onChange={(e) => setTrailMins(Number(e.target.value))}
                    className="w-full bg-[#121114] border border-[#26242C] focus:border-[#F05423] rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="45">45 Mins</option>
                    <option value="60">60 Mins</option>
                    <option value="90">90 Mins</option>
                    <option value="120">120 Mins</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTrailCreatorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold cursor-pointer"
                >
                  Synthesize Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy & Safety Settings Section */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#26242C] pb-3">
          <span className="material-symbols-outlined text-[#F05423] text-lg">shield</span>
          <div>
            <h3 className="text-base font-bold text-white">Privacy & Safety</h3>
            <p className="text-xs text-zinc-400">Manage blocked players and social interaction safety controls</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-mono text-zinc-400 uppercase font-bold">Blocked Users ({blockedList.length})</h4>
          {blockedList.length === 0 ? (
            <p className="text-xs text-zinc-500 bg-[#121114] border border-[#26242C] p-4 rounded-2xl text-center">
              You haven't blocked any players.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedList.map((block) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0">
                      {block.blockedAvatar || '🛡️'}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{block.blockedName || 'Blocked Explorer'}</h5>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">@{block.blockedUsername || 'blocked'}</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await unblockUser(getActiveUserId(), block.blockedUserId);
                      setBlockedList((prev) => prev.filter((b) => b.blockedUserId !== block.blockedUserId));
                      onShowToast('Unblocked user. Friendship is not automatically restored.');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog when leaving Edit Profile */}
      <AnimatePresence>
        {showUnsavedConfirm && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setShowUnsavedConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1A1F] border border-amber-500/30 w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center relative"
            >
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl mx-auto flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  You have unsaved changes. What would you like to do?
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You modified <span className="text-zinc-200 font-semibold">{changedFieldsList.join(', ')}</span>. If you discard, your edits will not be saved.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* 1. Save Changes */}
                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveProfile(pendingTab || 'overview');
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold transition-all shadow-md shadow-[#F05423]/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </button>

                {/* 2. Discard Changes */}
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  <span>Discard Changes</span>
                </button>

                {/* 3. Cancel */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    setPendingGlobalTab(null);
                    setPendingTab(null);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1C1A1F] border border-white/5 w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-rose-500/10 rounded-full mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-rose-500">logout</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Disconnect Signal?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to terminate your current session? Your explorer progress is safely archived in the KAOS grid.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
