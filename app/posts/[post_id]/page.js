"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  MoreHorizontal,
  ChevronDown,
  Reply,
} from "lucide-react";
import { api, normalizePost, normalizeComment } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import Avatar from "../../components/Avatar";
import { AUTH_FIELD_CLASS } from "@/lib/authUi";

const COMMENTS_BATCH = 3;

export default function PostPage({ params: paramsPromise }) {
  const { post_id } = use(paramsPromise);
  const [post, setPost] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [score, setScore] = useState(0);
  const [voted, setVoted] = useState(null); // null | "up"
  const [commentText, setCommentText] = useState("");
  const [visible, setVisible] = useState(COMMENTS_BATCH);

  useEffect(() => {
    api.getPost(post_id)
      .then((raw) => {
        const p = normalizePost(raw);
        setPost(p);
        setScore(p.likes);
      })
      .catch((e) => console.error("Post:", e.message));
    api.getComments(post_id)
      .then((res) => setAllComments((Array.isArray(res) ? res : []).map(normalizeComment)))
      .catch((e) => console.error("Comments:", e.message));
  }, [post_id]);

  async function submitComment() {
    if (!commentText.trim()) return;
    try {
      const comment = await api.createComment({ post_id, body: commentText.trim() });
      setAllComments((prev) => [normalizeComment(comment), ...prev]);
      setCommentText("");
    } catch {}
  }

  function toggleVote() {
    if (!post) return;
    const isVoted = voted === "up";
    if (isVoted) {
      api.unlikePost(String(post.id)).catch(() => {});
      setScore((s) => s - 1);
      setVoted(null);
    } else {
      api.likePost(String(post.id)).catch(() => {});
      setScore((s) => s + 1);
      setVoted("up");
    }
  }

  if (!post) return <div className="py-20 text-center text-xs text-zinc-600">Loading…</div>;

  const shown = allComments.slice(0, visible);
  const remaining = allComments.length - visible;

  return (
    <div className="mx-auto w-[70%] min-w-[320px] py-8">
      <Link
        href="/home"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={13} /> Back
      </Link>


      <article className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        {/* Author row */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={post.author.avatar} username={post.author.username} size="md" />
            <div>
              <Link
                href={`/profile/${post.author.id}`}
                className="text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                {post.author.username}
              </Link>
              <p className="text-xs text-zinc-600">
                <span className="text-teal-400">#{post.community.name}</span>
                {" · "}
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <button className="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-400">
            <MoreHorizontal size={15} />
          </button>
        </div>
        <div className="px-5 py-5">
          
        <h1 className="text-xl font-bold leading-snug text-zinc-50">{post.title}</h1>
        </div>

        {/* Image */}
        {post.imageLink && <PostImage src={post.imageLink} alt={post.title} />}

        {/* Title + body */}
        <div className="px-5 py-5"> 
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-t border-zinc-800 px-4 py-2.5">
          <button
            onClick={toggleVote}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              voted === "up"
                ? "bg-teal-500/15 text-teal-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            <ArrowUp size={13} /> {score}
          </button>
          <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-zinc-600">
            <MessageSquare size={13} /> {allComments.length} comment{allComments.length !== 1 ? "s" : ""}
          </span>
        </div>
      </article>

      {/* ── Comment input ───────────────────────────────────── */}
      <div className="mt-6 flex items-start gap-3">
        <Avatar username="me" size="sm" />
        <div className="flex-1">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className={`${AUTH_FIELD_CLASS} w-full resize-none`}
          />
          {commentText.trim() && (
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setCommentText("")}
                className="rounded-md px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                className="rounded-md bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
              >
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments ────────────────────────────────────────── */}
      {allComments.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
            {allComments.length} comment{allComments.length !== 1 ? "s" : ""}
          </p>

          <div className="flex flex-col gap-3">
            {shown.map((c) => (
              <CommentItem key={c.id} comment={c} depth={0} postId={post_id} onReply={(nc) => setAllComments((prev) => [nc, ...prev])} />
            ))}
          </div>

          {remaining > 0 && (
            <button
              onClick={() => setVisible((v) => v + COMMENTS_BATCH)}
              className="mt-4 w-full rounded-md border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              Load {Math.min(COMMENTS_BATCH, remaining)} more comment
              {Math.min(COMMENTS_BATCH, remaining) !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PostImage ───────────────────────────────────────────────── */
function PostImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div className="relative flex w-full justify-center bg-zinc-950">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`max-h-[75vh] w-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/* ── CommentItem ─────────────────────────────────────────────── */
function CommentItem({ comment, depth = 0, postId, onReply }) {
  const [score, setScore] = useState(comment.likes);
  const [vote, setVote] = useState(null);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  function castVote(dir) {
    setVote((prev) => {
      const removing = prev === dir;
      setScore(removing ? comment.likes : comment.likes + (dir === "up" ? 1 : -1));
      if (removing) {
        api.unlikeComment(comment.id).catch(() => {});
      } else {
        api.likeComment(comment.id).catch(() => {});
      }
      return removing ? null : dir;
    });
  }

  const hasReplies = comment.replies?.length > 0;

  return (
    <div>
      {/* Comment body */}
      <div
        className={`rounded-lg border bg-zinc-900 p-3.5 ${
          depth > 0 ? "border-zinc-800/40" : "border-zinc-800"
        }`}
        style={depth > 0 ? { borderLeft: "2px solid rgb(63 63 70)" } : {}}
      >
        <div className="flex gap-2.5">
          <Avatar src={comment.author.avatar} username={comment.author.username} size="sm" />
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-baseline gap-2">
              <Link
                href={`/profile/${comment.author.id}`}
                className="text-xs font-semibold text-zinc-300 transition-colors hover:text-zinc-100"
              >
                {comment.author.username}
              </Link>
              <span className="text-xs text-zinc-600">{timeAgo(comment.createdAt)}</span>
            </div>

            {/* Content */}
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{comment.content}</p>

            {/* Action row */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {/* Vote */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => castVote("up")}
                  className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
                    vote === "up" ? "text-teal-400" : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <ArrowUp size={11} />
                </button>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    vote === "up" ? "text-teal-400" : vote === "down" ? "text-red-400" : "text-zinc-500"
                  }`}
                >
                  {score}
                </span>
                <button
                  onClick={() => castVote("down")}
                  className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
                    vote === "down" ? "text-red-400" : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <ArrowDown size={11} />
                </button>
              </div>

              {/* Reply — available at every depth */}
              <button
                onClick={() => setShowReply((v) => !v)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  showReply ? "text-teal-400" : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                <Reply size={11} /> Reply
              </button>

              {/* Load / hide replies */}
              {hasReplies && (
                <button
                  onClick={() => setRepliesLoaded((v) => !v)}
                  className="ml-auto flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                >
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-150 ${repliesLoaded ? "rotate-180" : ""}`}
                  />
                  {repliesLoaded
                    ? "Hide replies"
                    : `Load ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>

            {/* Inline reply input */}
            {showReply && (
              <div className="mt-2.5 flex items-start gap-2">
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className={`${AUTH_FIELD_CLASS} flex-1 py-1.5 text-xs`}
                />
                {replyText.trim() && (
                  <button
                    onClick={async () => {
                      try {
                        const reply = await api.createComment({ post_id: postId, body: replyText.trim(), parent_id: comment.id });
                        onReply?.(normalizeComment(reply));
                      } catch {}
                      setShowReply(false);
                      setReplyText("");
                    }}
                    className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
                  >
                    Reply
                  </button>
                )}
                <button
                  onClick={() => { setShowReply(false); setReplyText(""); }}
                  className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies — only rendered once "Load replies" is clicked */}
      {repliesLoaded && hasReplies && (
        <div className="ml-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 pl-2">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} depth={depth + 1} postId={postId} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
