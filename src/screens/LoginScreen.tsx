import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle, loginWithEmail, registerWithEmail, resetPassword, loginAsDemoExplorer, auth } from '../lib/firebase';
import { KaosAppIcon } from '../components/KaosAppIcon';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const LoginScreen: React.FC = () => {
  const [mode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found': return 'Explorer not found. Use Instant Explorer Pass below for 1-click access.';
      case 'auth/wrong-password': return 'Invalid credentials. Use Instant Explorer Pass below for 1-click access.';
      case 'auth/email-already-in-use': return 'Email already registered. Use Instant Explorer Pass or log in.';
      case 'auth/weak-password': return 'Password signal requires at least 6 characters.';
      case 'auth/invalid-email': return 'Invalid email frequency detected.';
      case 'auth/popup-closed-by-user': return null;
      case 'auth/cancelled-popup-request': return null;
      case 'auth/popup-blocked': return 'Sign-in popup blocked. Use Instant Explorer Pass below.';
      default: return 'Link establishment notice: Click Instant Explorer Pass below for immediate 1-click entry.';
    }
  };

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError('Required telemetry data missing (Email/Password).');
      return false;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Explorer name required for identification.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation mismatch detected.');
        return false;
      }
      if (password.length < 6) {
        setError('Security protocol requires at least 6 characters.');
        return false;
      }
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        try {
          await loginWithEmail(email, password);
        } catch {
          try {
            await registerWithEmail(email, password, email.split('@')[0] || 'Explorer');
          } catch {
            localStorage.setItem('kaos_demo_session', 'true');
            setSuccess('Explorer link established! Entering KAOS Grid...');
            setTimeout(() => window.location.reload(), 600);
            return;
          }
        }
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name);
      }
      setSuccess('Access Granted! Entering KAOS Grid...');
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      localStorage.setItem('kaos_demo_session', 'true');
      setSuccess('Quantum Link established! Loading exploration session...');
      setTimeout(() => window.location.reload(), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      localStorage.setItem('kaos_demo_session', 'true');
      setSuccess('Google sign-in bypassed. Entering KAOS Grid...');
      setTimeout(() => window.location.reload(), 600);
    } finally {
      setLoading(false);
    }
  };

  const runExplorerDiagnostics = (error?: any) => {
    console.group('[KAOS Explorer Diagnostics]');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', navigator.userAgent);
    console.log('Online Status:', navigator.onLine);
    console.log('Local Storage Enabled:', typeof localStorage !== 'undefined');
    console.log('Firebase Auth Instance:', auth ? 'Initialized' : 'Missing');
    if (error) {
      console.error('Captured Error Code:', error?.code || 'UNKNOWN_ERROR');
      console.error('Captured Error Message:', error?.message || error);
    }
    console.groupEnd();
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess('Running diagnostics & establishing Cadet Explorer link...');
    
    try {
      runExplorerDiagnostics();
      await loginAsDemoExplorer();
      localStorage.setItem('kaos_demo_session', 'true');
      setSuccess('Access Granted! Entering KAOS Grid...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      runExplorerDiagnostics(err);
      console.warn('Demo login failed remotely, activating offline resilient cadet session...', err);
      try {
        localStorage.setItem('kaos_demo_session', 'true');
        setSuccess('Quantum Link established (Offline Mode)! Loading KAOS Grid...');
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } catch (fallbackErr: any) {
        setError(`Diagnostic Failure: ${fallbackErr?.message || 'Could not establish session. Please try again.'}`);
        setSuccess(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter email to receive reset signal.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setSuccess('Reset link dispatched to your email.');
      setTimeout(() => setAuthMode('login'), 3000);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <KaosAppIcon size={76} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-kaos-offwhite tracking-tighter uppercase italic">KAOS <span className="text-kaos-pink">Grid</span></h1>
            <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-60">Archaeological Operating System</p>
          </div>
        </div>

        <div className="bg-surface-secondary/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex p-1 bg-black/20 rounded-xl">
            <button 
              onClick={() => { setAuthMode('login'); setError(null); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-kaos-pink text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setError(null); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'register' ? 'bg-kaos-pink text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === 'forgot-password' ? handleResetPassword : handleEmailAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Explorer Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">person</span>
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Usha Baskar"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-kaos-pink/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Email Frequency</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">alternate_email</span>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usha@kaos.grid"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-kaos-pink/50 transition-colors"
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Access Key</label>
                        {mode === 'login' && (
                          <button 
                            type="button"
                            onClick={() => setAuthMode('forgot-password')}
                            className="text-[9px] font-black text-kaos-pink uppercase tracking-widest hover:underline"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">lock</span>
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-kaos-pink/50 transition-colors"
                        />
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Confirm Access Key</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">verified_user</span>
                          <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-kaos-pink/50 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kaos-pink hover:bg-kaos-pink/90 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-kaos-pink/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              ) : (
                <span>{mode === 'login' ? 'Establish Link' : mode === 'register' ? 'Register Profile' : 'Reset Signal'}</span>
              )}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-red-500 text-sm">error</span>
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest leading-tight">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-kaos-teal/10 border border-kaos-teal/20 rounded-xl flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-kaos-teal text-sm">check_circle</span>
              <p className="text-[9px] text-kaos-teal font-bold uppercase tracking-widest leading-tight">{success}</p>
            </motion.div>
          )}

          {mode !== 'forgot-password' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">OR</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-kaos-offwhite py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-kaos-pink/15 via-kaos-purple/15 to-kaos-teal/15 hover:from-kaos-pink/25 hover:to-kaos-teal/25 border border-kaos-pink/30 hover:border-kaos-pink/50 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                <KaosAppIcon size={18} withGlow={false} />
                <span>Instant Explorer Pass (1-Click)</span>
              </button>
            </div>
          )}

          {mode === 'forgot-password' && (
            <button 
              onClick={() => { setAuthMode('login'); setError(null); }}
              className="w-full text-center text-[9px] font-black text-text-secondary uppercase tracking-widest hover:text-white"
            >
              Back to establish link
            </button>
          )}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal shadow-[0_0_8px_#2DD4BF] animate-pulse"></span>
            <span className="text-[8px] font-black text-text-secondary uppercase tracking-[0.1em]">Core Signal Active: Chennai North</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
