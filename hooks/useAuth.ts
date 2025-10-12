'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  const isAdmin = session?.user?.role === 'admin';
  const isUser = session?.user?.role === 'user';
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  return {
    session,
    user: session?.user,
    role: session?.user?.role,
    whopData: session?.user?.whopData,
    isAdmin,
    isUser,
    isLoading,
    isAuthenticated,
  };
}
