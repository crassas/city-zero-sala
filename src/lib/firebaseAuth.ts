import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

const SESSION_STORAGE_KEY = 'grocer_drive_oauth_session_v1';

export interface OAuthSessionData {
  accessToken: string;
  expiresAt: number;
  uid: string;
  email: string | null;
  scope: string;
}

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Helper to safely load session from storage
export const getStoredOAuthSession = (): OAuthSessionData | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: OAuthSessionData = JSON.parse(raw);
    if (!session?.accessToken || !session?.expiresAt) return null;
    // Check if token is still valid (with 60s buffer)
    if (Date.now() >= session.expiresAt - 60000) {
      clearStoredOAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const persistOAuthSession = (session: OAuthSessionData) => {
  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Unable to persist OAuth session:', err);
  }
};

export const clearStoredOAuthSession = () => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to clear OAuth session:', err);
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Check in-memory cache first, then persistent storage
      const storedSession = getStoredOAuthSession();
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (storedSession && storedSession.uid === user.uid) {
        cachedAccessToken = storedSession.accessToken;
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      clearStoredOAuthSession();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    
    // Store safe session (1 hour validity standard for Google OAuth access tokens)
    const sessionData: OAuthSessionData = {
      accessToken: cachedAccessToken,
      expiresAt: Date.now() + 3600 * 1000,
      uid: result.user.uid,
      email: result.user.email,
      scope: 'https://www.googleapis.com/auth/drive.file'
    };
    persistOAuthSession(sessionData);

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const session = getStoredOAuthSession();
  if (session) {
    cachedAccessToken = session.accessToken;
    return cachedAccessToken;
  }
  return null;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  clearStoredOAuthSession();
};
