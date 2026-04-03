import { create } from "zustand";

/**
 * Session + auth actions. Wire `login` / `setSession` to your API when ready.
 */
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setSession: (user, token) =>
    set({ user, token, error: null, isLoading: false }),

  clearSession: () => set({ user: null, token: null, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: replace with API — then setSession(data.user, data.token)
      await Promise.resolve();
      console.log("Login", { username, password });
      set({ isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  },

  logout: () => set({ user: null, token: null, error: null }),
}));
