"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { api, normalizePost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import PostCard from "../../components/PostCard";
import Avatar from "../../components/Avatar";

export default function ProfilePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  useEffect(() => {
    setError(null);
    api.getProfile(params.user_id)
      .then((p) => { setProfile(p); return api.getUserPosts(p.username); })
      .then((raw) => setPosts((raw ?? []).map(normalizePost)))
      .catch((e) => setError(e.message));
  }, [params.user_id]);

  function onSaved(updated) {
    setProfile((p) => ({ ...p, ...updated }));
    updateProfile({ username: updated.username, avatar: updated.avatar ?? null });
    setEditOpen(false);
  }

  if (error) return <div className="py-20 text-center text-sm text-red-400">{error}</div>;
  if (!profile) return <div className="py-20 text-center text-xs text-zinc-600">Loading…</div>;

  const isOwn = currentUser?.username === profile.username;
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-5">
          <Avatar src={profile.avatar} username={profile.username} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-zinc-50">{profile.username}</h1>
            {profile.bio
              ? <p className="mt-1.5 text-sm text-zinc-400">{profile.bio}</p>
              : <p className="mt-1.5 text-sm italic text-zinc-600">No bio yet.</p>}
            <div className="mt-4 flex items-center gap-6">
              <Stat label="Posts" value={posts.length} />
              <Stat label="Likes received" value={totalLikes} />
            </div>
          </div>
          {isOwn && (
            <button
              onClick={() => setEditOpen(true)}
              className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
          Posts by {profile.username}
        </p>
        {posts.length > 0
          ? <div className="flex flex-col gap-2">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
          : (
            <div className="rounded-lg border border-zinc-800/60 py-12 text-center">
              <p className="text-sm text-zinc-500">
                {isOwn ? "You haven't posted anything yet." : `${profile.username} hasn't posted anything yet.`}
              </p>
            </div>
          )}
      </div>

      {editOpen && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function EditModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({ bio: profile.bio ?? "", avatar: profile.avatar ?? "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const updated = await api.updateProfile({ bio: form.bio.trim(), avatar: form.avatar.trim() });
      onSaved(updated);
    } catch (e) {
      setError(e.message ?? "Failed to save.");
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-zinc-200">Edit profile</p>
          <button onClick={onClose} className="rounded p-1 text-zinc-600 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar src={form.avatar || null} username={profile.username} size="lg" />
            <p className="text-sm font-medium text-zinc-300">{profile.username}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself…"
              className={`${AUTH_FIELD_CLASS} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Avatar URL</label>
            <input
              name="avatar"
              type="url"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.png"
              className={AUTH_FIELD_CLASS}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`${AUTH_PRIMARY_BUTTON_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-base font-bold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-600">{label}</p>
    </div>
  );
}
