"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import { useSignupStore } from "@/store/signupStore";

export default function SignupPage() {
  const fileInputRef = useRef(null);

  const {
    step,
    username,
    password,
    avatarLink,
    bio,
    errors,
    setUsername,
    setPassword,
    setBio,
    setStep,
    goToStep2,
    setAvatarFromFile,
    clearAvatarLink,
    reset,
  } = useSignupStore(
    useShallow((s) => ({
      step: s.step,
      username: s.username,
      password: s.password,
      avatarLink: s.avatarLink,
      errors: s.errors,
      bio: s.bio,
      setUsername: s.setUsername,
      setPassword: s.setPassword,
      setStep: s.setStep,
      goToStep2: s.goToStep2,
      setAvatarFromFile: s.setAvatarFromFile,
      clearAvatarLink: s.clearAvatarLink,
      reset: s.reset,
    }))
  );

  useEffect(() => {
    return () => reset();
  }, [reset]);

  function handleContinue(e) {
    e.preventDefault();
    goToStep2();
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFromFile(file);
  }

  async function handleFinish(e) {
    e.preventDefault();
    const { username: u, password: p, avatarFile } = useSignupStore.getState();
    // TODO: wire up to API (multipart for avatar) — then reset() and setSession in authStore
    console.log("Signup", {
      username: u.trim(),
      password: p,
      avatarFile: avatarFile ?? null,
    });
  }

  return (
    <AuthSplitLayout>
      <div className="flex flex-col gap-8">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">1chan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">Create account</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {step === 1 ? "Credentials" : "Profile picture"}
          </p>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            <span
              className={`h-0.5 flex-1 rounded-full ${step >= 1 ? "bg-zinc-200" : "bg-zinc-800"}`}
            />
            <span
              className={`h-0.5 flex-1 rounded-full ${step >= 2 ? "bg-zinc-200" : "bg-zinc-800"}`}
            />
          </div>
        </header>

        {step === 1 ? (
          <form onSubmit={handleContinue} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-username" className="text-xs text-zinc-500">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className={AUTH_FIELD_CLASS}
              />
              {errors.username ? <p className="text-xs text-red-400">{errors.username}</p> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-xs text-zinc-500">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={AUTH_FIELD_CLASS}
              />
              {errors.password ? <p className="text-xs text-red-400">{errors.password}</p> : null}
            </div>

            <button type="submit" className={`mt-1 ${AUTH_PRIMARY_BUTTON_CLASS}`}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinish} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-400"
                style={
                  avatarLink
                    ? {
                      backgroundImage: `url(${avatarLink})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                    : undefined
                }
              >
                {!avatarLink ? (
                  <span className="px-3 text-center text-xs leading-snug">Add photo</span>
                ) : null}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
                >
                  Upload from device
                </button>
                {avatarLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearAvatarLink();
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-zinc-600 hover:text-zinc-400"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label
                  htmlFor="signup-bio"
                  className="text-xs text-zinc-500"
                >
                  Bio
                </label>

                <textarea
                  id="signup-bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself..."
                  rows={4}
                  className={`${AUTH_FIELD_CLASS} resize-none`}
                />

                <div className="flex justify-between items-center">

                  <span className="text-xs text-zinc-500">
                    {bio.length}/160
                  </span>
                </div>
              </div> 
            </div>

            <div className="flex flex-col gap-3">
              <button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS}>
                Create account
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Back
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
