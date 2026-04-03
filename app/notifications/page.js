"use client";

import { useState } from "react";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
        {items.map((n) => (
          <li
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex cursor-pointer items-center gap-3 border-b border-zinc-800/60 py-3 transition-colors last:border-0 hover:bg-zinc-900/40 ${
              n.read ? "opacity-50" : ""
            }`}
          >
            {/* Unread dot */}
            <span className="flex w-4 shrink-0 items-center justify-center">
              {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />}
            </span>

            {/* Text */}
            <p className={`flex-1 min-w-0 truncate text-sm ${n.read ? "text-zinc-500" : "text-zinc-300"}`}>
              {n.text}
            </p>

            {/* Time */}
            <span className="shrink-0 text-xs text-zinc-600">{timeAgo(n.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
