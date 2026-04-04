"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, MessageSquare, ImageOff } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Avatar from "./Avatar";

export default function PostCard({ post }) {
  const [score, setScore] = useState(post.likes);
  const [vote, setVote] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  function castVote(dir) {
    setVote((prev) => {
      const removing = prev === dir;
      setScore(removing ? post.likes : post.likes + (dir === "up" ? 1 : -1));
      return removing ? null : dir;
    });
  }

  return (
    <article className="flex gap-3 border border-zinc-800 bg-zinc-900 px-3 py-3 transition-colors hover:border-zinc-700">
      {/* Vote column */}
      <div className="flex w-6 shrink-0 flex-col items-center gap-0.5 pt-1">
        <button
          onClick={() => castVote("up")}
          className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
            vote === "up" ? "text-teal-400" : "text-zinc-700 hover:text-zinc-400"
          }`}
        >
          <ArrowUp size={13} />
        </button>
        <span
          className={`text-[11px] font-semibold tabular-nums ${
            vote === "up" ? "text-teal-400" : vote === "down" ? "text-red-400" : "text-zinc-500"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => castVote("down")}
          className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
            vote === "down" ? "text-red-400" : "text-zinc-700 hover:text-zinc-400"
          }`}
        >
          <ArrowDown size={13} />
        </button>
      </div>
 
      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-1.5 mt-0.5">
          <Avatar src={post.author.avatar} username={post.author.username} size="xs" />
          <p className="text-[10px] text-zinc-600">
            <Link
              href={`/profile/${post.author.id}`}
              className="transition-colors hover:text-zinc-400 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              @{post.author.username}
            </Link>
            <span className="font-medium text-teal-400/80"> #{post.community.name}</span>
          </p>
        </div>

        {/* Title */}
        <Link href={`/posts/${post.id}`}>
          <h2 className="mt-0.5 text-m font-semibold leading-snug text-zinc-200 transition-colors hover:text-teal-300 mb-2">
            {post.title}
          </h2>
        </Link>

        {/* Body preview */}
        {post.content && (
          <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-zinc-600 ">
            {post.content}
          </p>
        )}
        {post.imageLink && (
          <Link href={`/posts/${post.id}`} className="mt-2 block">
            <div
              className="relative w-full overflow-hidden rounded-md bg-zinc-900 flex items-center justify-center"
              style={{ maxHeight: "80vh" }}
            >
              {!imgLoaded && !imgError && (
                <div className="h-52 w-full animate-pulse bg-zinc-800" />
              )}
              {imgError ? (
                <div className="flex h-32 items-center justify-center gap-2 text-xs text-zinc-600">
                  <ImageOff size={14} /> Image unavailable
                </div>
              ) : (
                <img
                  src={post.imageLink}
                  alt={post.title}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className={`w-full object-contain transition-opacity duration-300 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ maxHeight: "80vh" }}
                />
              )}
            </div>
          </Link>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center gap-1">
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400"
          >
            <MessageSquare size={11} />
            {post.commentCount}
          </Link>
        </div>
      </div>
    </article>
  );
}