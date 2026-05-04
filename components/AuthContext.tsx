'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

interface DatabaseUser {
  id: string;
  clerkId?: string | null;
  handle: string;
  userRole: string;
  roleCategory: string;
  companyCategory: string;
  verificationStatus: string;
  verificationMethod?: string | null;
  linkedinUrl?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
  email?: string | null;
  emailVerified: boolean;
  trustScore: number;
  reputationScore: number;
  badges: string[];
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: DatabaseUser | null;
  userId: string | null;
  userRole: string | null;
  verificationStatus: string | null;
  handle: string | null;
  anonymousHandle: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isOrganization: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

  useEffect(() => {
    const fetchUserDetails = async () => {
      // Only fetch user details if Clerk is loaded and user is signed in
      if (!clerkLoaded) {
        setLoading(true);
        return;
      }

      if (!isSignedIn) {
        setDbUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/details');
        if (response.ok) {
          const userData = await response.json();
          setDbUser(userData.user);
        } else {
          setDbUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        setDbUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [clerkLoaded, isSignedIn]);

  const value: AuthContextType = {
    user: dbUser,
    userId: dbUser?.id || null,
    userRole: dbUser?.userRole || null,
    verificationStatus: dbUser?.verificationStatus || null,
    handle: dbUser?.handle || null,
    anonymousHandle: dbUser?.handle || null,
    isAuthenticated: !!dbUser && !!isSignedIn,
    isAdmin: dbUser?.userRole === 'admin',
    isOperator: dbUser?.userRole === 'operator',
    isOrganization: dbUser?.userRole === 'organization',
    loading: loading || !clerkLoaded,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Backward compatibility: export useAuth as alias for useAuthContext
export { useAuthContext as useAuth };