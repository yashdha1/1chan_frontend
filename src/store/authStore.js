import { create } from "zustand";
import { api, parseJwt, setAccessToken } from "@/lib/api";

function loadSession() {
  try {
    const stored = localStorage.getItem("user_profile");
    const profile = stored ? JSON.parse(stored) : null;
    if (!profile) return { user: null };
    return { user: profile };
  } catch { return { user: null }; }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  _hydrated: false,
  isLoading: false,
  error: null,

  rehydrate: () => {
    if (get()._hydrated) return;
    const { user } = loadSession();
    set({ user, _hydrated: true });
  },

  setSession: (user) => {
    try {
      localStorage.setItem("user_profile", JSON.stringify({ id: user.id, username: user.username, avatar: user.avatar, role: user.role }));
    } catch {}
    set({ user, error: null, isLoading: false });
  },

  clearSession: () => {
    setAccessToken(null);
    try { localStorage.removeItem("user_profile"); } catch {}
    set({ user: null, error: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  /** Update cached profile fields (username / avatar) after profile edit. */
  updateProfile: (patch) => {
    set((s) => {
      const user = s.user ? { ...s.user, ...patch } : s.user;
      try {
        localStorage.setItem("user_profile", JSON.stringify({ id: user.id, username: user.username, avatar: user.avatar, role: user.role }));
      } catch {}
      return { user };
    });
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(username, password);
      setAccessToken(data.access_token);
      const payload = parseJwt(data.access_token);
      const user = {
        id: payload?.id ?? null,
        username: payload?.username ?? username,
        role: payload?.role ?? "user",
        avatar: payload?.avatar ?? null,
      };
      try {
        localStorage.setItem("user_profile", JSON.stringify({ id: user.id, username: user.username, avatar: user.avatar, role: user.role }));
      } catch {}
      set({ user, isLoading: false, error: null });
      globalThis.location.replace("/home");
    } catch (e) {
      set({ isLoading: false, error: e.message ?? "Something went wrong." });
    }
  },

  logout: async () => {
    try { await api.logout(); } catch {}
    setAccessToken(null);
    try { localStorage.removeItem("user_profile"); } catch {}
    set({ user: null, error: null });
    globalThis.location.replace("/login");
  },
}));

