"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import Avatar from "./Avatar";
import { api } from "@/lib/api";

export default function PostCard({ post }) {
  const [score, setScore] = useState(post.likes);
  const [vote, setVote] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [likedBy, setLikedBy] = useState(null);
  const [likedByOpen, setLikedByOpen] = useState(false);
  const [likedByLoading, setLikedByLoading] = useState(false);
  const likedByRef = useRef(null);

  useEffect(() => {
    if (!likedByOpen) return;
    function handleClickOutside(e) {
      if (likedByRef.current && !likedByRef.current.contains(e.target)) {
        setLikedByOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [likedByOpen]);

  function castVote(dir) {
    setVote((prev) => {
      const removing = prev === dir;
      const newScore = removing ? post.likes : post.likes + (dir === "up" ? 1 : -1);
      setScore(newScore);
      if (removing) {
        api.unlikePost(String(post.id)).catch(() => {});
      } else {
        api.likePost(String(post.id)).catch(() => {});
      }
      return removing ? null : dir;
    });
  }

  // fetch the list of users who liked the post.
  async function handleLikedByClick(e) {
    e.stopPropagation();
    if (likedByOpen) {
      setLikedByOpen(false);
      return;
    }
    setLikedByOpen(true);
    if (likedBy !== null) return;
    setLikedByLoading(true);
    try {
      const data = await api.getPostLikedBy(String(post.id));
      setLikedBy(Array.isArray(data) ? data : data?.users ?? []);
    } catch {
      setLikedBy([]);
    } finally {
      setLikedByLoading(false);
    }
  }

  return (
    <article className="flex w-full gap-3 border border-zinc-800 bg-zinc-900 px-3 py-3 transition-colors hover:border-zinc-700">
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
        <div className="relative" ref={likedByRef}>
          <button
            className={`text-[11px] font-semibold tabular-nums ${
              vote === "up" ? "text-teal-400" : vote === "down" ? "text-red-400" : "text-zinc-500"
            }`}
            onClick={handleLikedByClick}
          >
            {score}
          </button>

            {/* liked by window is opened  */}
          {likedByOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-5 z-50 min-w-[120px] rounded-md border border-zinc-700 bg-zinc-900 py-1.5 shadow-lg">
              {likedByLoading ? (
                <p className="px-3 py-1 text-[11px] text-zinc-500">Loading…</p>
              ) : likedBy && likedBy.length > 0 ? (
                <ul className="max-h-40 overflow-y-auto">
                  {likedBy.map((u) => (
                    <li key={u.user_name ?? u} className="px-3 py-0.5 text-[11px] text-zinc-300">
                      @{u.user_name ?? u}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-1 text-[11px] text-zinc-500">No likes yet</p>
              )}
            </div>
          )}

        </div>
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
        {post.imageLink && !imgError && (
          <Link href={`/posts/${post.id}`} className="mt-2 block">
            <div
              className="relative flex max-h-[32rem] w-full items-center justify-center overflow-hidden rounded-md bg-zinc-950/70"
            >
              {!imgLoaded && !imgError && (
                <div className="h-52 w-full animate-pulse bg-zinc-800" />
              )}
              <img
                src={post.imageLink}
                alt={post.title}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`max-h-[32rem] w-full object-contain transition-opacity duration-300 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </Link>
        )}

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