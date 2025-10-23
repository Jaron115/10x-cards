import { create } from "zustand";
import type { AuthUserDTO } from "@/types";

interface AuthState {
  user: AuthUserDTO | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: AuthUserDTO | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

/**
 * Zustand store for authentication state
 * Manages current user data and provides methods to fetch/update user state
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  /**
   * Sets the current user
   */
  setUser: (user) => set({ user, isInitialized: true }),

  /**
   * Sets loading state
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Fetches current user from /api/auth/me
   * Called on app initialization to restore user session
   */
  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.data.user, isInitialized: true });
      } else if (response.status === 401) {
        // User not authenticated
        set({ user: null, isInitialized: true });
      } else {
        console.error("[AUTH_STORE] Failed to fetch user:", response.statusText);
        set({ user: null, isInitialized: true });
      }
    } catch (error) {
      console.error("[AUTH_STORE] Error fetching user:", error);
      set({ user: null, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Clears user state (used during logout)
   */
  clearUser: () => set({ user: null }),
}));
