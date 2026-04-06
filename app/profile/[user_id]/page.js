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
  const [adminTools, setAdminTools] = useState(false);
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
  const isAdmin = currentUser?.role === "admin";
  const isMod = currentUser?.role === "mod";
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

            {/* admin pop up window  */}
            {isOwn && isAdmin  && (
            <button
              onClick={() => setAdminTools(true)}
              className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Admin Tools
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

      {adminTools && (
        <AdminToolsModal onClose={() => setAdminTools(false)} />
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

const ROLES = ["user", "mod", "admin"];

function AdminToolsModal({ onClose }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [tag, setTag] = useState("");
  const [tagMsg, setTagMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (tab !== "users") return;
    setUsersLoading(true);
    api.getUsers("all")
      .then((res) => setUsers(res ?? []))
      .catch((e) => setActionMsg(e.message ?? "Failed to load users."))
      .finally(() => setUsersLoading(false));
  }, [tab]);

  async function handleRoleChange(userId, newRole) {
    setActionMsg("");
    try {
      const updated = await api.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role ?? newRole } : u)));
    } catch (e) {
      setActionMsg(e.message ?? "Failed to update role.");
    }
  }

  async function handleDelete(userId) {
    setActionMsg("");
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setActionMsg(e.message ?? "Failed to delete user.");
    }
  }

  async function handleAddTag(e) {
    e.preventDefault();
    if (!tag.trim()) return;
    setTagMsg("");
    try {
      await api.addTag({ tag: tag.trim() });
      setTagMsg("Tag added.");
      setTag("");
    } catch (e) {
      setTagMsg(e.message ?? "Failed to add tag.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-zinc-200">Admin Tools</p>
          <button onClick={onClose} className="rounded p-1 text-zinc-600 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {["users", "tags"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setActionMsg(""); setTagMsg(""); }}
              className={`px-5 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-teal-400 text-teal-400"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-5 py-4">
          {tab === "users" && (
            <div className="flex flex-col gap-2">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
              {usersLoading && <p className="text-xs text-zinc-500">Loading…</p>}
              {!usersLoading && users.length === 0 && <p className="text-xs text-zinc-500">No users found.</p>}
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
                {users.filter((u) => (u.username ?? u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-md border border-zinc-800 px-3 py-2">
                    <span className="flex-1 truncate text-sm text-zinc-300">{u.username ?? u.email}</span>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              {actionMsg && <p className="text-xs text-red-400">{actionMsg}</p>}
            </div>
          )}

          {tab === "tags" && (
            <form onSubmit={handleAddTag} className="flex flex-col gap-3">
              <label className="text-xs text-zinc-500">New tag name</label>
              <div className="flex gap-2">
                <input
                  value={tag}
                  onChange={(e) => { setTag(e.target.value); setTagMsg(""); }}
                  placeholder="e.g. technology"
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white"
                >
                  Add
                </button>
              </div>
              {tagMsg && (
                <p className={`text-xs ${tagMsg === "Tag added." ? "text-teal-400" : "text-red-400"}`}>{tagMsg}</p>
              )}
            </form>
          )}
        </div>
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
