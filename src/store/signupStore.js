import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "./authStore";
import { api, parseJwt, setAccessToken, uploadToCloudinary } from "@/lib/api";

function validateStep1(username, password) {
  const errors = {};
  if (!username.trim()) {
    errors.username = "Username is required.";
  } else if (username.trim().length < 3) {
    errors.username = "At least 3 characters.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "At least 8 characters.";
  } else if (password.length > 128) {
    errors.password = "At most 128 characters.";
  }
  return errors;
}

export const useSignupStore = create((set, get) => ({
  step: 1,
  username: "",
  password: "",
  avatarLink: "",   // object URL for preview
  avatarFile: null,
  bio: "",
  errors: {},
  isLoading: false,
  submitError: null,

  setUsername: (username) =>
    set((s) => ({ username, errors: { ...s.errors, username: undefined } })),

  setPassword: (password) =>
    set((s) => ({ password, errors: { ...s.errors, password: undefined } })),

  setBio: (bio) => set({ bio }),

  setStep: (step) => set({ step }),

  goToStep2: () => {
    const { username, password } = get();
    const e1 = validateStep1(username, password);
    if (Object.keys(e1).length > 0) {
      set({ errors: e1 });
      return false;
    }
    set({ step: 2, errors: {} });
    return true;
  },

  setAvatarFromFile: (file) => {
    if (!file.type.startsWith("image/")) {
      set((s) => ({ errors: { ...s.errors, avatar: "Choose an image file." } }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      set((s) => ({ errors: { ...s.errors, avatar: "Max size 5 MB." } }));
      return;
    }
    set((s) => {
      if (s.avatarLink) URL.revokeObjectURL(s.avatarLink);
      return {
        avatarFile: file,
        avatarLink: URL.createObjectURL(file),
        errors: { ...s.errors, avatar: undefined },
      };
    });
  },

  clearAvatarLink: () => {
    set((s) => {
      if (s.avatarLink) URL.revokeObjectURL(s.avatarLink);
      return { avatarFile: null, avatarLink: "", errors: { ...s.errors, avatar: undefined } };
    });
  },

  register: async () => {
    const { username, password, bio, avatarFile } = get();
    set({ isLoading: true, submitError: null });
    try {
      const userId = crypto.randomUUID();

      // Upload avatar to Cloudinary if provided
      let avatarUrl = "";
      if (avatarFile) {
        const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const result = await uploadToCloudinary(avatarFile, userId);
        avatarUrl = `https://res.cloudinary.com/${cloud}/image/upload/v${result.version}/avatars/${userId}`;
      }

      const authData = await api.register({
        id: userId,
        username: username.trim(),
        password,
        bio: bio.trim(),
        avatar: avatarUrl,
        role: "user",
      });

      setAccessToken(authData.access_token);
      const payload = parseJwt(authData.access_token);

      useAuthStore.getState().setSession({
        id: payload?.id ?? userId,
        username: username.trim(),
        role: payload?.role ?? "user",
        avatar: avatarUrl || null,
      });
      get().reset();
      globalThis.location.replace("/home");
    } catch (e) {
      set({ isLoading: false, submitError: e.message ?? "Something went wrong." });
    }
  },

  reset: () => {
    const { avatarLink } = get();
    if (avatarLink) URL.revokeObjectURL(avatarLink);
    set({
      step: 1,
      username: "",
      password: "",
      avatarFile: null,
      avatarLink: "",
      bio: "",
      errors: {},
      isLoading: false,
      submitError: null,
    });
  },
}));

export function useSignupForm() {
  return useSignupStore(
    useShallow((s) => ({
      step: s.step,
      username: s.username,
      password: s.password,
      avatarLink: s.avatarLink,
      bio: s.bio,
      errors: s.errors,
      isLoading: s.isLoading,
      submitError: s.submitError,
      setUsername: s.setUsername,
      setPassword: s.setPassword,
      setBio: s.setBio,
      setStep: s.setStep,
      goToStep2: s.goToStep2,
      setAvatarFromFile: s.setAvatarFromFile,
      clearAvatarLink: s.clearAvatarLink,
      register: s.register,
      reset: s.reset,
    }))
  );
}

