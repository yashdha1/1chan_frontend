"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Search, ChevronDown, Image, Tag } from "lucide-react";
import PostCard from "../components/PostCard";
import { AUTH_FIELD_CLASS } from "@/lib/authUi";
import Link from "next/link";
import { api, normalizePost, uploadToCloudinary } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const PAGE_SIZE = 4;
const FILTERS = [
  { id: "latest", label: "Latest" },
  { id: "suggested", label: "Suggested" },
];
const MAX_TAGS = 5;
const EMPTY_FORM = { title: "", content: "" };

export default function HomePage() {
  const [filter, setFilter] = useState("latest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSearchOpen, setAdminSearchOpen] = useState(false);

  /* form state */
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [tagQuery, setTagQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDropOpen, setTagDropOpen] = useState(false);

  /* real data */
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchedPosts, setSearchedPosts] = useState([]);
  const searchedUsers = [];

  const fileInputRef = useRef(null);
  const tagInputRef = useRef(null);
  const filterRef = useRef(null);
  const adminSearchRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const isPrivileged = user?.role === "mod" || user?.role === "admin";

  /* close filter dropdown when clicking outside */
  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* close admin  */
  useEffect(() => {
    function handleClick(e) {
      if (adminSearchRef.current && !adminSearchRef.current.contains(e.target)) {
        setAdminSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);


  // feed generate and load 
  useEffect(() => {
    let active = true;

    async function loadFeed() {
      setFeedLoading(true);
      setFeedError("");
      try {
        const res = await api.generateFeed(filter);
        if (!active) return;
        const items = Array.isArray(res?.posts) ? res.posts : [];
        setPosts(items.map(normalizePost));
        setPage(1);
      } catch (err) {
        if (!active) return;
        setPosts([]);
        setFeedError(err.message || "Failed to load feed");
      } finally {
        if (active) {
          setFeedLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      active = false;
    };
  }, [filter]);

  // fetch the available tags
  useEffect(() => {
    api.getTags()
      .then((res) => setTags((res ?? []).map((t) => t.name)))
      .catch(() => {});
  }, []);

  /* admin search */
  useEffect(() => {
    if (!adminSearch.trim()) { setSearchedPosts([]); return; }
    const t = setTimeout(() => {
      api.searchPosts(adminSearch.trim())
        .then((res) => setSearchedPosts((res.items ?? []).slice(0, 5)))
        .catch(() => setSearchedPosts([]));
    }, 300);
    return () => clearTimeout(t);
  }, [adminSearch]);

  const sorted = posts;
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pagePosts = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasAdminResults = searchedPosts.length > 0;

  function handlePostDeleted(postId) {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  }

  function changeFilter(f) {
    setFilter(f);
    setFilterOpen(false);
    setPage(1);
  }

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSelectedTags([]);
    setTagQuery("");
    setTagDropOpen(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const tagSuggestions = tags.filter(
    (t) => tagQuery && t.toLowerCase().includes(tagQuery.toLowerCase()) && !selectedTags.includes(t)
  ).slice(0, 6);

  function addTag(tag) {
    if (selectedTags.length >= MAX_TAGS) return;
    setSelectedTags((p) => [...p, tag]);
    setTagQuery("");
    setTagDropOpen(false);
    tagInputRef.current?.focus();
  }

  function removeTag(tag) {
    setSelectedTags((p) => p.filter((t) => t !== tag));
  }

  async function handlePost(e) {
    e.preventDefault();
    try {
      let image_link = null;
      if (imageFile) {
        console.log("Uploading image to Cloudinary.");
        const result = await uploadToCloudinary(imageFile, crypto.randomUUID()); 
        image_link = result.secure_url;
      }
      console.log("Creating post with data:", { ...form, image_link, tags: selectedTags });
      const newPost = await api.createPost({
        title: form.title,
        body: form.content,
        image_link,
        tags: selectedTags.length > 0 ? selectedTags : ["general"],
      });
      setPosts((prev) => [normalizePost(newPost), ...prev]);
      closeModal();
    } catch (err) {
      console.error("Create post failed:", err.message);
    }
  }

  const activeFilter = FILTERS.find((f) => f.id === filter);

  return (
    <div className="mx-auto w-full px-4 py-8 lg:w-2/3">

      {/* Mod / Admin search with fast results */}
      {/* {isPrivileged && (
        <div ref={adminSearchRef} className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none z-10" />
          <input
            type="text"
            value={adminSearch}
            onChange={(e) => { setAdminSearch(e.target.value); setAdminSearchOpen(true); }}
            onFocus={() => adminSearch && setAdminSearchOpen(true)}
            placeholder="Search posts, users…"
            className={`${AUTH_FIELD_CLASS} pl-9 pr-8`}
          />
          {adminSearch && (
            <button
              onClick={() => { setAdminSearch(""); setAdminSearchOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={13} />
            </button>
          )}
 
          {adminSearchOpen && adminSearch.trim() && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-xl">
              {!hasAdminResults && (
                <p className="px-3 py-3 text-xs text-zinc-600">No results for &ldquo;{adminSearch}&rdquo;</p>
              )}

              {searchedPosts.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                    Posts
                  </p>
                  {searchedPosts.map((p) => (
                    <Link
                      key={p.post_id}
                      href={`/posts/${p.post_id}`}
                      onClick={() => { setAdminSearch(""); setAdminSearchOpen(false); }}
                      className="flex flex-col px-3 py-2 transition-colors hover:bg-zinc-800"
                    >
                      <span className="truncate text-xs text-zinc-300">{p.title}</span>
                    </Link>
                  ))}
                </>
              )}

              {searchedUsers.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 border-t border-zinc-800/60">
                    Users
                  </p>
                  {searchedUsers.map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.id}`}
                      onClick={() => { setAdminSearch(""); setAdminSearchOpen(false); }}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-zinc-800"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                        {u.username[0].toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-300">{u.username}</span>
                      <span className="ml-auto text-[10px] text-zinc-600">{u.role}</span>
                    </Link>
                  ))}
                </>
              )}

              {hasAdminResults && (
                <div className="border-t border-zinc-800/60 px-3 py-2">
                  <span className="text-[10px] text-zinc-600">
                    {searchedPosts.length + searchedUsers.length} result{searchedPosts.length + searchedUsers.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )} */}

      {/* Filter dropdown */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            {activeFilter.label}
            <ChevronDown
              size={13}
              className={`text-zinc-500 transition-transform duration-150 ${filterOpen ? "rotate-180" : ""}`}
            />
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => changeFilter(f.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-zinc-800 ${
                    filter === f.id ? "text-teal-400" : "text-zinc-400"
                  }`}
                >
                  {filter === f.id && <span className="h-1 w-1 rounded-full bg-teal-400" />}
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="flex flex-col gap-2">
        {feedLoading ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-6 text-sm text-zinc-500">
            Loading {activeFilter.label.toLowerCase()} feed...
          </div>
        ) : feedError ? (
          <div className="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-6 text-sm text-red-300">
            {feedError}
          </div>
        ) : pagePosts.length === 0 ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-6 text-sm text-zinc-500">
            No posts found for this feed.
          </div>
        ) : (
          pagePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canModerateDelete={isPrivileged}
              onDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* FAB */}
      {!isPrivileged && (
        <div className="group fixed bottom-7 right-7 z-40 flex items-center gap-2">
          <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-md bg-zinc-800 py-1.5 text-xs font-medium text-zinc-300 opacity-0 transition-all duration-200 group-hover:max-w-[8rem] group-hover:px-3 group-hover:opacity-100">
            Make Post
          </span>
          <button
            onClick={() => setShowModal(true)}
            title="Make Post"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 shadow-lg shadow-zinc-950/60 ring-1 ring-zinc-700 transition-all duration-200 hover:bg-teal-500 hover:text-zinc-950 hover:ring-teal-500"
          >
            <Plus size={22} />
          </button>
        </div>
      )}

      {/* Make Post modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">

            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
              <p className="text-sm font-semibold text-zinc-200">New Post</p>
              <button
                onClick={closeModal}
                className="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handlePost} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">

              {/* Title */}
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={AUTH_FIELD_CLASS}
                required
                autoFocus
              />

              {/* Body */}
              <textarea
                placeholder="What's on your mind? (optional)"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={5}
                className={`${AUTH_FIELD_CLASS} resize-none`}
              />

              {/* Image upload */}
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Image size={12} /> Image
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-md border border-zinc-700">
                    <img src={imagePreview} alt="" className="max-h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-300 backdrop-blur-sm transition-colors hover:text-zinc-100"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 py-4 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-400"
                  >
                    <Image size={14} />
                    Upload image
                  </button>
                )}
              </div>

              {/* Tags */}
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Tag size={12} /> Tags
                  <span className="ml-auto text-zinc-600">{selectedTags.length}/{MAX_TAGS}</span>
                </p>

                {/* Applied tag pills */}
                {selectedTags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 rounded-full border border-teal-700/40 bg-teal-500/10 px-2.5 py-0.5 text-xs text-teal-400"
                      >
                        #{t}
                        <button type="button" onClick={() => removeTag(t)} className="ml-0.5 opacity-60 hover:opacity-100">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag search input */}
                {selectedTags.length < MAX_TAGS && (
                  <div className="relative">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagQuery}
                      onChange={(e) => { setTagQuery(e.target.value); setTagDropOpen(true); }}
                      onFocus={() => tagQuery && setTagDropOpen(true)}
                      onBlur={() => setTimeout(() => setTagDropOpen(false), 150)}
                      placeholder="Search tags…"
                      className={`${AUTH_FIELD_CLASS} text-xs`}
                    />
                    {tagDropOpen && tagSuggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
                        {tagSuggestions.map((t) => (
                          <li key={t}>
                            <button
                              type="button"
                              onMouseDown={() => addTag(t)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            >
                              <span className="text-zinc-600">#</span>{t}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md px-4 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pagination ─────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <PgBtn onClick={() => onChange(page - 1)} disabled={page === 1} label="← Prev" />
      {pages.map((p) => (
        <PgBtn key={p} onClick={() => onChange(p)} active={p === page} label={String(p)} />
      ))}
      <PgBtn onClick={() => onChange(page + 1)} disabled={page === totalPages} label="Next →" />
    </nav>
  );
}

function PgBtn({ onClick, disabled, active, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[2.25rem] rounded border px-2 py-1.5 text-xs transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        active
          ? "border-teal-500 bg-teal-500/15 font-semibold text-teal-400"
          : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
