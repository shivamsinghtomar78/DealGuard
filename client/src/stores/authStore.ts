import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    company?: string;

}

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    initializeAuth: () => Promise<void>;
    setUser: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: true,
            initializeAuth: async () => {
                set({ loading: true });

                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        // Verify the token is still valid by fetching user profile
                        const response = await authAPI.getProfile();
                        // The server returns user data inside a 'data' property
                        if (response.data && response.data.success && response.data.data) {
                            set({
                                user: response.data.data,
                                token: token,
                                isAuthenticated: true
                            });
                        } else {
                            // Token exists but is invalid, clear it
                            localStorage.removeItem('token');
                            set({ user: null, token: null, isAuthenticated: false });
                        }
                    }
                } catch (error) {
                    // Token verification failed, clear stored token
                    localStorage.removeItem('token');
                    set({ user: null, token: null, isAuthenticated: false });
                } finally {
                    set({ loading: false });
                }
            },
            setUser: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
