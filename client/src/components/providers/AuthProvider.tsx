'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    const loading = useAuthStore((state) => state.loading);

    useEffect(() => {
        // Initialize auth state on app load
        initializeAuth();
    }, [initializeAuth]);

    // Optionally render a loading state while verifying auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#030303]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-white/70">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}