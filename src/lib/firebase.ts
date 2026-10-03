import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google sign-in popup was dismissed or closed.');
    } else {
      console.error('Login error:', error);
    }
    throw error;
  }
};

export const loginAsDemoExplorer = async () => {
  const demoEmail = 'cadet.explorer@kaos.grid';
  const demoPass = 'KaosGrid2026!';
  try {
    const res = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    localStorage.setItem('kaos_demo_session', 'true');
    return res.user;
  } catch (err: any) {
    try {
      const newUser = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
      await updateProfile(newUser.user, { displayName: 'Cadet Explorer' });
      localStorage.setItem('kaos_demo_session', 'true');
      return newUser.user;
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-in-use') {
        const retry = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        localStorage.setItem('kaos_demo_session', 'true');
        return retry.user;
      }
    }
    // Fallback resilient local demo session for Instant Explorer Pass
    localStorage.setItem('kaos_demo_session', 'true');
    return {
      uid: 'demo-cadet-explorer-uid',
      email: demoEmail,
      displayName: 'Cadet Explorer',
      emailVerified: true,
      isAnonymous: false,
    };
  }
};

export const performSecureSignOut = async () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('kaos_') || key.includes('session') || key.includes('user') || key.includes('quest'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('kaos_demo_session');
    localStorage.removeItem('kaos_active_quest');
    sessionStorage.clear();
    await signOut(auth);
    window.location.replace('/');
  } catch (error) {
    console.error('performSecureSignOut error:', error);
    throw error;
  }
};

export const logout = performSecureSignOut;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
    }
  }
}

testFirestoreConnection();

// KAOS Firebase System Active
