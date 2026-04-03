"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, X, LogOut } from "lucide-react";
import { MOCK_NOTIFICATIONS, MOCK_POSTS, MOCK_USERS, CURRENT_USER } from "@/lib/mockData";
import { timeAgo } from "@/lib/utils";

const UNREAD_COUNT = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

export default function Navbar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  const q = query.trim().toLowerCase();
  const postResults = q
    ? MOCK_POSTS.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author.username.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];
  const userResults = q
    ? MOCK_USERS.filter((u) => u.username.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const hasResults = postResults.length > 0 || userResults.length > 0;

  useEffect(() => {
    function handle(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function clearSearch() {
    setQuery("");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/95 px-6 backdrop-blur">

      {/* 1 · Logo */}
      <Link
        href="/home"
        className="shrink-0 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-100"
      >
        1chan
      </Link>

      <span className="h-4 w-px shrink-0 bg-zinc-800" />

      {/* 2 · Activity / Notifications */}
      <Link
        href="/notifications"
        title="Activity"
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
          pathname === "/notifications"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
        }`}
      >
        <Bell size={17} />
        {UNREAD_COUNT > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-teal-500 px-1 text-[9px] font-bold leading-none text-zinc-950">
            {UNREAD_COUNT}
          </span>
        )}
      </Link>

      <span className="h-4 w-px shrink-0 bg-zinc-800" />

      {/* 3 · Search — fills remaining space */}
      <div ref={searchRef} className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          placeholder="Search posts, users…"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 py-1.5 pl-8 pr-8 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <X size={13} />
          </button>
        )}

        {/* Results dropdown */}
        {open && q && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-xl">
            {!hasResults && (
              <p className="px-3 py-3 text-xs text-zinc-600">No results for &ldquo;{query}&rdquo;</p>
            )}

            {postResults.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                  Posts
                </p>
                {postResults.map((p) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}`}
                    onClick={clearSearch}
                    className="flex flex-col px-3 py-2 transition-colors hover:bg-zinc-800"
                  >
                    <span className="truncate text-xs text-zinc-300">{p.title}</span>
                    <span className="text-[10px] text-zinc-600">
                      {p.author.username} · {timeAgo(p.createdAt)}
                    </span>
                  </Link>
                ))}
              </>
            )}

            {userResults.length > 0 && (
              <>
                <p className="border-t border-zinc-800/60 px-3 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                  Users
                </p>
                {userResults.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    onClick={clearSearch}
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

            {hasResults && (
              <div className="border-t border-zinc-800/60 px-3 py-2">
                <span className="text-[10px] text-zinc-600">
                  {postResults.length + userResults.length} result
                  {postResults.length + userResults.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="h-4 w-px shrink-0 bg-zinc-800" />

      {/* 4 · Profile */}
      <Link
        href={`/profile/${CURRENT_USER.id}`}
        title="Profile"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
          pathname.startsWith("/profile")
            ? "bg-teal-500 text-zinc-950 ring-2 ring-teal-500 ring-offset-1 ring-offset-zinc-950"
            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        {CURRENT_USER.username[0].toUpperCase()}
      </Link>

      {/* 5 · Logout */}
      <button
        onClick={() => console.log("logout")}
        title="Log out"
        className="shrink-0 rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-400"
      >
        <LogOut size={15} />
      </button>

    </header>
  );
}
