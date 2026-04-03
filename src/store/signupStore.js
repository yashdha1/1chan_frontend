import { create } from "zustand";

function validateStep1(username, password) {
  const errors = {};
  if (!username.trim()) errors.username = "Username is required.";
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
  avatarLink: "",
  bio: "", 
  errors: {},

  setUsername: (username) =>
    set((s) => ({
      username,
      errors: { ...s.errors, username: undefined },
    })),

  setPassword: (password) =>
    set((s) => ({
      password,
      errors: { ...s.errors, password: undefined },
    })),

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
      set((s) => ({
        errors: { ...s.errors, avatar: "Choose an image file." },
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      set((s) => ({
        errors: { ...s.errors, avatar: "Max size 5 MB." },
      }));
      return;
    }
    set((s) => {
      if (s.avatarPreviewUrl) URL.revokeObjectURL(s.avatarPreviewUrl);
      return {
        avatarFile: file,
        avatarPreviewUrl: URL.createObjectURL(file),
        errors: { ...s.errors, avatar: undefined },
      };
    });
  },

  clearAvatar: () => {
    set((s) => {
      if (s.avatarPreviewUrl) URL.revokeObjectURL(s.avatarPreviewUrl);
      return {
        avatarFile: null,
        avatarPreviewUrl: null,
        errors: { ...s.errors, avatar: undefined },
      };
    });
  },

  /** Clears wizard + revokes preview URL. Call on successful signup or when leaving the flow. */
  reset: () => {
    const { avatarPreviewUrl } = get();
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    set({
      step: 1,
      username: "",
      password: "",
      avatarFile: null,
      avatarPreviewUrl: null,
      errors: {},
    });
  },
}));
