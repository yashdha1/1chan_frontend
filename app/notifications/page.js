"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getNotifications(0)
      .then((res) => setItems(res ?? []))
      .catch(() => {});
  }, []);

  const unreadCount = items.filter((n) => !n.is_read || n.is_read === "false").length;

  async function markAllRead() {
    const unread = items.filter((n) => !n.is_read || n.is_read === "false");
    await Promise.allSettled(unread.map((n) => api.markRead(n.id)));
    setItems((prev) => prev.map((n) => ({ ...n, is_read: "true" })));
  }

  function markRead(id) {
    api.markRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: "true" } : n)));
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-zinc-300">
          Activity
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-400">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            Mark all read
          </button>
        )}
      </div>

      <ul className="flex flex-col">
        {items.map((n) => {
          const isRead = n.is_read === "true" || n.is_read === true;
          const text = n.body
            ? `${n.publisher_name} commented: ${n.body}`
            : `${n.publisher_name} ${n.type}d your post "${n.post_title}"`;
          return (
          <li
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex cursor-pointer items-center gap-3 border-b border-zinc-800/60 py-3 transition-colors last:border-0 hover:bg-zinc-900/40 ${
              isRead ? "opacity-50" : ""
            }`}
          >
            {/* Unread dot */}
            <span className="flex w-4 shrink-0 items-center justify-center">
              {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />}
            </span>

            {/* Text */}
            <p className={`flex-1 min-w-0 truncate text-sm ${isRead ? "text-zinc-500" : "text-zinc-300"}`}>
              {text}
            </p>

            {/* Time */}
            <span className="shrink-0 text-xs text-zinc-600">{timeAgo(n.created_at)}</span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
