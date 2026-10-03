import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateHandle } from '../utils/handleValidation';

export interface UserProfileData {
  displayName: string;
  username: string;
  bio: string;
  avatar: string;
  availabilityStatus: string;
  interests: string[];
}

export const AVAILABLE_INTERESTS = [
  'Heritage',
  'Architecture',
  'Food Lore',
  'Temple Tanks',
  'Colonial History',
  'Soundscapes',
  'Hidden Gems',
  'Photography',
  'Coffee Roasteries',
  'Sacred Cosmology',
];

export const PRESET_AVATARS = [
  '/app-icon.svg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  '🛡️',
  '🧭',
  '🏛️',
  '☕',
  '👑',
  '🌊',
  '📜',
  '✨',
];

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfileData;
  onClose: () => void;
  onSave: (updatedProfile: UserProfileData) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  onShowToast,
}) => {
  // Current editing state
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🛡️');
  const [availabilityStatus, setAvailabilityStatus] = useState(profile.availabilityStatus || 'Available Now');
  const [interests, setInterests] = useState<string[]>(profile.interests || ['Heritage', 'Architecture']);

  // Initial snapshot to compare against for unsaved changes
  const initialSnapshotRef = useRef<UserProfileData>({ ...profile });

  // UI & Flow states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    displayName?: string;
    username?: string;
    bio?: string;
  }>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Field element refs for auto-scroll and focus on validation error
  const displayNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state whenever modal opens or profile prop changes
  useEffect(() => {
    if (isOpen) {
      const snap: UserProfileData = {
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '🛡️',
        availabilityStatus: profile.availabilityStatus || 'Available Now',
        interests: Array.isArray(profile.interests) ? [...profile.interests] : ['Heritage', 'Architecture'],
      };
      initialSnapshotRef.current = snap;

      setDisplayName(snap.displayName);
      setUsername(snap.username);
      setBio(snap.bio);
      setAvatar(snap.avatar);
      setAvailabilityStatus(snap.availabilityStatus);
      setInterests(snap.interests);

      setValidationErrors({});
      setSaveError(null);
      setSaveSuccess(false);
      setIsSaving(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, profile]);

  // Compute changed fields
  const isNameChanged = displayName.trim() !== initialSnapshotRef.current.displayName.trim();
  const isUsernameChanged = username.trim().toLowerCase() !== initialSnapshotRef.current.username.trim().toLowerCase();
  const isBioChanged = bio.trim() !== initialSnapshotRef.current.bio.trim();
  const isAvatarChanged = avatar !== initialSnapshotRef.current.avatar;
  const isStatusChanged = availabilityStatus !== initialSnapshotRef.current.availabilityStatus;
  
  const areInterestsChanged = (() => {
    const orig = initialSnapshotRef.current.interests || [];
    if (interests.length !== orig.length) return true;
    const sortedA = [...interests].sort();
    const sortedB = [...orig].sort();
    return sortedA.some((val, idx) => val !== sortedB[idx]);
  })();

  const hasUnsavedChanges =
    isNameChanged ||
    isUsernameChanged ||
    isBioChanged ||
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

  // Protect against accidental window / tab close or navigation when unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isOpen) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnsavedChanges]);

  // Safe close handler that checks for unsaved changes
  const handleRequestClose = useCallback(() => {
    if (isSaving) return;
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, isSaving, onClose]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: { displayName?: string; username?: string; bio?: string } = {};

    // 1. Display name validation
    if (!displayName.trim()) {
      errors.displayName = 'Please enter your display name.';
    } else if (displayName.trim().length > 50) {
      errors.displayName = 'Display name must be 50 characters or fewer.';
    }

    // 2. Handle validation
    const handleCheck = validateHandle(username);
    if (!handleCheck.isValid) {
      errors.username = handleCheck.error || 'Please enter a valid handle.';
    }

    // 3. Bio validation
    if (bio.length > 300) {
      errors.bio = 'Bio cannot exceed 300 characters.';
    }

    setValidationErrors(errors);

    // Auto-scroll and focus the first invalid field
    if (errors.displayName && displayNameRef.current) {
      displayNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      displayNameRef.current.focus();
      return false;
    }

    if (errors.username && usernameRef.current) {
      usernameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      usernameRef.current.focus();
      return false;
    }

    if (errors.bio && bioRef.current) {
      bioRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bioRef.current.focus();
      return false;
    }

    return Object.keys(errors).length === 0;
  };

  // Perform save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);

    // Step 1: Validate
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Step 2: Show Saving State
    setIsSaving(true);

    const handleCheck = validateHandle(username);
    const updated: UserProfileData = {
      displayName: displayName.trim(),
      username: handleCheck.normalizedHandle,
      bio: bio.trim(),
      avatar: avatar || '🛡️',
      availabilityStatus: availabilityStatus,
      interests: interests,
    };

    try {
      // Step 3: Save through parent callback
      const success = await onSave(updated);

      if (success) {
        // Step 4: Success Feedback & Reset State
        initialSnapshotRef.current = { ...updated };
        setSaveSuccess(true);
        setSaveError(null);
        onShowToast('Changes saved successfully! ✨');

        // Close after brief delay so user sees saved feedback
        setTimeout(() => {
          setIsSaving(false);
          setSaveSuccess(false);
          onClose();
        }, 600);
      } else {
        throw new Error('Save unsuccessful');
      }
    } catch (err: any) {
      // Step 5: Saving Error Behavior - Keep user changes intact, show clear error
      console.error('Failed to save profile:', err);
      setIsSaving(false);
      setSaveError("Couldn't save your changes. Please try again.");
      onShowToast("Couldn't save your changes. Please try again.");
    }
  };

  // Discard changes and close
  const handleDiscardChanges = () => {
    // Restore form to original snapshot
    const snap = initialSnapshotRef.current;
    setDisplayName(snap.displayName);
    setUsername(snap.username);
    setBio(snap.bio);
    setAvatar(snap.avatar);
    setAvailabilityStatus(snap.availabilityStatus);
    setInterests(snap.interests);

    setValidationErrors({});
    setSaveError(null);
    setShowDiscardConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md font-sans select-none overflow-hidden animate-in fade-in duration-200"
      onClick={handleRequestClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-2xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden relative"
      >
        {/* Header - Fixed & Touch friendly */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#26242C] bg-[#1C1A1F]/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F05423]/10 border border-[#F05423]/30 flex items-center justify-center text-[#F05423] shrink-0">
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="edit-profile-heading" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Edit Profile
                </h2>
                {hasUnsavedChanges ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>{changedFieldsList.length} Unsaved</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono font-medium">
                    Up to date
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
                Update your Chennai heritage explorer persona and preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close Edit Profile"
            className="w-10 h-10 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Global Save Error Banner if present */}
        {saveError && (
          <div className="mx-5 sm:mx-7 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-400">error</span>
              <span className="font-medium">{saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold text-[11px] hover:bg-rose-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scrollable Form Body - Smooth Touch & Desktop Scrolling */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-zinc-700"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Section 1: Identity & Credentials */}
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
              <label htmlFor="edit-profile-display-name" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Display Name <span className="text-[#F05423]">*</span></span>
                <span className="text-[10px] text-zinc-500">{displayName.length}/50</span>
              </label>
              <input
                id="edit-profile-display-name"
                ref={displayNameRef}
                type="text"
                maxLength={50}
                required
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (validationErrors.displayName) {
                    setValidationErrors((prev) => ({ ...prev, displayName: undefined }));
                  }
                }}
                placeholder="e.g. Usha Baskar"
                className={`w-full bg-[#121114] border rounded-xl px-3.5 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all ${
                  validationErrors.displayName
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : isNameChanged
                    ? 'border-amber-500/60 focus:border-[#F05423]'
                    : 'border-[#26242C] focus:border-[#F05423]'
                }`}
              />
              {validationErrors.displayName && (
                <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5 animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{validationErrors.displayName}</span>
                </p>
              )}
            </div>

            {/* Username / Handle Input */}
            <div className="space-y-1.5">
              <label htmlFor="edit-profile-handle" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Explorer Handle (@username) <span className="text-[#F05423]">*</span></span>
                <span className="text-[10px] text-zinc-500">3–20 lowercase letters, numbers, _</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-zinc-500 font-mono text-sm font-bold select-none">@</span>
                <input
                  id="edit-profile-handle"
                  ref={usernameRef}
                  type="text"
                  maxLength={25}
                  required
                  value={username}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setUsername(raw);
                    const check = validateHandle(raw);
                    if (!check.isValid) {
                      setValidationErrors((prev) => ({ ...prev, username: check.error }));
                    } else {
                      setValidationErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  placeholder="usha_explorer"
                  className={`w-full bg-[#121114] border rounded-xl pl-8 pr-3.5 py-3 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none transition-all ${
                    validationErrors.username
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : isUsernameChanged
                      ? 'border-amber-500/60 focus:border-[#F05423]'
                      : 'border-[#26242C] focus:border-[#F05423]'
                  }`}
                />
              </div>
              {validationErrors.username && (
                <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5 animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{validationErrors.username}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Visual Avatar & Profile Photo */}
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

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 rounded-2xl bg-[#121114] border border-[#26242C]">
              {/* Large touch-friendly preview */}
              <div className="w-20 h-20 rounded-2xl bg-[#1C1A1F] border-2 border-[#26242C] flex items-center justify-center text-4xl overflow-hidden shrink-0 shadow-lg relative group">
                {avatar && (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.includes('svg')) ? (
                  <img src={avatar} alt="Current avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{avatar || '🛡️'}</span>
                )}
                {isAvatarChanged && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#1C1A1F]" />
                )}
              </div>

              {/* Upload custom image */}
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
                          setAvatar(reader.result as string);
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

            {/* Touch-Friendly Avatar Selector Row */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Or choose an explorer badge:</span>
              <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-thin touch-pan-x">
                {PRESET_AVATARS.map((preset, idx) => {
                  const isSelected = avatar === preset;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border flex items-center justify-center overflow-hidden transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'border-[#F05423] ring-2 ring-[#F05423]/50 bg-[#F05423]/10 scale-105'
                          : 'border-[#26242C] bg-[#121114] hover:border-zinc-500'
                      }`}
                      aria-label={`Select avatar ${preset}`}
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

          {/* Section 3: Status & Bio */}
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

            {/* Status Select */}
            <div className="space-y-1.5">
              <label htmlFor="edit-profile-status" className="text-xs font-semibold text-zinc-300">
                Current Expedition Status
              </label>
              <div className="relative">
                <select
                  id="edit-profile-status"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  className={`w-full bg-[#121114] border rounded-xl px-3.5 py-3 text-sm text-zinc-100 focus:outline-none transition-all cursor-pointer appearance-none ${
                    isStatusChanged ? 'border-amber-500/60 focus:border-[#F05423]' : 'border-[#26242C] focus:border-[#F05423]'
                  }`}
                >
                  <option value="Available Now">🟢 Available Now — Ready for live expeditions</option>
                  <option value="Exploring">🧭 Exploring — Currently in the field</option>
                  <option value="Away">🌙 Away — Transmitting from archive</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-zinc-400 pointer-events-none text-base">
                  expand_more
                </span>
              </div>
            </div>

            {/* Bio Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="edit-profile-bio" className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Explorer Biography</span>
                <span className={`text-[10px] ${bio.length > 280 ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
                  {bio.length}/300
                </span>
              </label>
              <textarea
                id="edit-profile-bio"
                ref={bioRef}
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (validationErrors.bio) {
                    setValidationErrors((prev) => ({ ...prev, bio: undefined }));
                  }
                }}
                placeholder="Share your heritage specialties, favorite sectors, or expedition goals..."
                className={`w-full bg-[#121114] border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none transition-all ${
                  validationErrors.bio
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : isBioChanged
                    ? 'border-amber-500/60 focus:border-[#F05423]'
                    : 'border-[#26242C] focus:border-[#F05423]'
                }`}
              />
              {validationErrors.bio && (
                <p className="text-xs text-rose-400 flex items-center gap-1 pt-0.5 animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{validationErrors.bio}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Explorer Interests */}
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
              Select the topics you are passionate about to personalize your squad and map quests:
            </p>

            <div className="flex flex-wrap gap-2 p-3 bg-[#121114] border border-[#26242C] rounded-2xl">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      setInterests((prev) =>
                        isSelected ? prev.filter((i) => i !== interest) : [...prev, interest]
                      );
                    }}
                    className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 select-none ${
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

          {/* Bottom spacing ensuring form ends comfortably before bottom bar */}
          <div className="h-6" />
        </div>

        {/* Footer Action Bar - Prominent Save Changes Button */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#26242C] bg-[#1C1A1F]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Secondary Cancel button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleRequestClose}
              className="flex-1 sm:flex-none min-h-[46px] px-5 py-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] active:bg-[#2d2a33] border border-[#26242C] text-zinc-300 hover:text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Primary Save Changes button */}
            <button
              type="button"
              disabled={!hasUnsavedChanges || isSaving}
              onClick={() => handleSave()}
              className={`flex-1 sm:flex-none min-h-[46px] px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
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
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setShowDiscardConfirm(false)}
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
                {/* 1. Save Changes & Leave */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowDiscardConfirm(false);
                    await handleSave();
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold transition-all shadow-md shadow-[#F05423]/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </button>

                {/* 2. Discard Changes & Leave */}
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  <span>Discard Changes</span>
                </button>

                {/* 3. Cancel Dialog & Stay */}
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfileModal;
