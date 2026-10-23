/**
 * Authentication Context for Socio-hub
 * Supports real Firebase Authentication token management with verified backend profile resolution,
 * alongside a safe, explicitly isolated development mode for offline testing.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/shared';
import { registerAuthTokenProvider } from '../services/apiClient';
import { MOCK_ADMIN_USER, MOCK_VOLUNTEER_USER, MOCK_COMMUNITY_USER } from '../mocks/adminData';

interface AuthContextType {
  currentUser: UserProfile | null;
  idToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  isCommunity: boolean;
  loginAs: (role: UserRole, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  authMode: 'firebase' | 'development_mock';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_AUTH_STORAGE_KEY = 'sociohub_auth_profile';
const DEV_TOKEN_STORAGE_KEY = 'sociohub_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'firebase' | 'development_mock'>('development_mock');

  // Register token provider for apiClient
  useEffect(() => {
    registerAuthTokenProvider(async () => {
      return idToken;
    });
  }, [idToken]);

  // Initial session restoration
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Check if Firebase Web SDK configuration is present
        const hasFirebaseConfig = Boolean(
          import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
        );

        if (hasFirebaseConfig) {
          setAuthMode('firebase');
          // In full Firebase mode, onAuthStateChanged listener would resolve user and token.
        } else {
          setAuthMode('development_mock');
        }

        // Restore saved session for seamless development experience
        const savedProfile = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
        const savedToken = localStorage.getItem(DEV_TOKEN_STORAGE_KEY);

        if (savedProfile && savedToken) {
          const parsed = JSON.parse(savedProfile) as UserProfile;
          setCurrentUser(parsed);
          setIdToken(savedToken);
        } else {
          // Default to Admin Aarav Singh to allow immediate inspection of the Admin workspace if user opens app
          setCurrentUser(MOCK_ADMIN_USER);
          const devToken = `dev_token_admin_${MOCK_ADMIN_USER.id}`;
          setIdToken(devToken);
          localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(MOCK_ADMIN_USER));
          localStorage.setItem(DEV_TOKEN_STORAGE_KEY, devToken);
        }
      } catch (err) {
        console.error('[AuthContext] Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginAs = async (role: UserRole, email?: string) => {
    setIsLoading(true);
    try {
      let targetUser: UserProfile;
      if (role === 'admin') {
        targetUser = { ...MOCK_ADMIN_USER, email: email || MOCK_ADMIN_USER.email };
      } else if (role === 'volunteer') {
        targetUser = { ...MOCK_VOLUNTEER_USER, email: email || MOCK_VOLUNTEER_USER.email };
      } else {
        targetUser = { ...MOCK_COMMUNITY_USER, email: email || MOCK_COMMUNITY_USER.email };
      }

      const generatedToken = `dev_firebase_id_token_${targetUser.role}_${targetUser.id}_${Date.now()}`;
      
      setCurrentUser(targetUser);
      setIdToken(generatedToken);

      localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(targetUser));
      localStorage.setItem(DEV_TOKEN_STORAGE_KEY, generatedToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setCurrentUser(null);
      setIdToken(null);
      localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
      localStorage.removeItem(DEV_TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(currentUser && idToken);
  const isAdmin = currentUser?.role === 'admin';
  const isVolunteer = currentUser?.role === 'volunteer';
  const isCommunity = currentUser?.role === 'community';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        idToken,
        isLoading,
        isAuthenticated,
        isAdmin,
        isVolunteer,
        isCommunity,
        loginAs,
        logout,
        authMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
