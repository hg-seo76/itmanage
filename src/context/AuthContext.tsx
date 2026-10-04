import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

export interface LocalUserSession {
  email: string;
  name: string;
}

const STORAGE_KEY_LOCAL_USER = 'school_itam_local_user_v1';

interface AuthContextType {
  currentUser: User | null;
  localUser: LocalUserSession | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsLocal: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [localUser, setLocalUser] = useState<LocalUserSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOCAL_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved local user', e);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) {
      loginAsLocal(email, email.split('@')[0] || '사용자');
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) {
      loginAsLocal(email, email.split('@')[0] || '사용자');
      return;
    }
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase가 설정되지 않았습니다.');
    await signInWithPopup(auth, googleProvider);
  };

  const loginAsLocal = (email = 'admin@school.es.kr', name = '정보담당 교사') => {
    const session = { email, name };
    setLocalUser(session);
    localStorage.setItem(STORAGE_KEY_LOCAL_USER, JSON.stringify(session));
  };

  const logout = async () => {
    setLocalUser(null);
    localStorage.removeItem(STORAGE_KEY_LOCAL_USER);
    if (isFirebaseConfigured) {
      await signOut(auth).catch(err => console.error(err));
    }
  };

  const isAuthenticated = Boolean(currentUser || localUser);
  const userEmail = currentUser?.email || localUser?.email || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        localUser,
        userEmail,
        isAuthenticated,
        loading,
        isFirebaseConfigured,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsLocal,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
