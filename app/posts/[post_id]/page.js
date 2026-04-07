"use client";

/* eslint-disable react/prop-types */

import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ChevronDown,
	MessageSquare,
	MoreHorizontal,
	Reply,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, normalizeComment, normalizePost } from "@/lib/api";
import { AUTH_FIELD_CLASS } from "@/lib/authUi";
import { timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import Avatar from "../../components/Avatar";

const COMMENTS_LIMIT = 10;

function mergeIncomingTopComment(prev, incoming) {
	for (const item of prev) {
		if (item.id === incoming.id) {
			return prev;
		}
	}
	return [incoming, ...prev];
}

function markCommentDeleted(list, commentId) {
	return list.map((item) => {
		const nextReplies = item.replies?.length
			? markCommentDeleted(item.replies, commentId)
			: item.replies;
		if (item.id !== commentId) {
			return nextReplies === item.replies
				? item
				: { ...item, replies: nextReplies };
		}
		return {
			...item,
			content: "[Delete]",
			replies: nextReplies,
		};
	});
}

function canDeleteCommentForUser(user, commentUserId, content) {
	if (content === "[Delete]") {
		return false;
	}
	return (
		user?.role === "admin" || user?.role === "mod" || user?.id === commentUserId
	);
}

export default function PostPage({ params: paramsPromise }) {
	const { post_id } = use(paramsPromise);
	const [post, setPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [topOffset, setTopOffset] = useState(0);
	const [hasMoreTop, setHasMoreTop] = useState(true);
	const [loadingTop, setLoadingTop] = useState(false);
	const [score, setScore] = useState(0);
	const [voted, setVoted] = useState(null); // null | "up"
	const [commentText, setCommentText] = useState("");
	const [totalCommentCount, setTotalCommentCount] = useState(0);

	function handleCommentTreeUpdate(update) {
		if (!update) return;
		if (update.type === "delete" && update.commentId) {
			setComments((prev) => markCommentDeleted(prev, update.commentId));
			setTotalCommentCount((value) => Math.max(0, value - 1));
			return;
		}
		setTotalCommentCount((value) => value + 1);
	}

	useEffect(() => {
		if (!post_id) return;

		const protocol =
			globalThis.window.location.protocol === "https:" ? "wss" : "ws";
		const host = globalThis.window.location.hostname;
		const ws = new WebSocket(`${protocol}://${host}:8003/ws/post/${post_id}`);

		ws.onopen = () => {
			ws.send("ping");
		};

		ws.onmessage = (event) => {
			try {
				const payload = JSON.parse(event.data);

				if (
					payload?.event === "like_update" &&
					payload.like_count !== undefined
				) {
					setScore(payload.like_count);
					return;
				}

				const raw = payload?.comment;
				if (!raw || payload?.event !== "comment_update") return;

				const incoming = normalizeComment(raw);

				// Keep top-level feed in sync; replies are fetched on demand per thread.
				if (!incoming.parentId) {
					setComments((prev) => mergeIncomingTopComment(prev, incoming));
				}
				setTotalCommentCount((v) => v + 1);
				setTopOffset((v) => v + 1);
			} catch {
				// ignore malformed ws payloads
			}
		};

		return () => {
			ws.close();
		};
	}, [post_id]);

	useEffect(() => {
		api
			.getPost(post_id)
			.then((raw) => {
				const p = normalizePost(raw);
				setPost(p);
				setScore(p.likes);
				setTotalCommentCount(p.commentCount ?? 0);
			})
			.catch((e) => console.error("Post:", e.message));

		setLoadingTop(true);
		api
			.getComments(post_id, 0)
			.then((res) => {
				const list = (Array.isArray(res) ? res : []).map((item) =>
					normalizeComment(item),
				);
				setComments(list);
				setTopOffset(list.length);
				setHasMoreTop(list.length >= COMMENTS_LIMIT);
			})
			.catch((e) => console.error("Comments:", e.message))
			.finally(() => setLoadingTop(false));
	}, [post_id]);

	async function submitComment() {
		if (!commentText.trim()) return;
		try {
			const comment = await api.createComment({
				post_id,
				body: commentText.trim(),
			});
			setComments((prev) => [normalizeComment(comment), ...prev]);
			setTopOffset((v) => v + 1);
			setTotalCommentCount((v) => v + 1);
			setCommentText("");
		} catch {}
	}

	async function loadMoreTopComments() {
		if (loadingTop || !hasMoreTop) return;
		setLoadingTop(true);
		try {
			const res = await api.getComments(post_id, topOffset);
			const list = (Array.isArray(res) ? res : []).map((item) =>
				normalizeComment(item),
			);
			setComments((prev) => [...prev, ...list]);
			setTopOffset((v) => v + list.length);
			setHasMoreTop(list.length >= COMMENTS_LIMIT);
		} catch (e) {
			console.error("More comments:", e.message);
		} finally {
			setLoadingTop(false);
		}
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

	if (!post)
		return (
			<div className="py-20 text-center text-xs text-zinc-600">Loading…</div>
		);

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
						<Avatar
							src={post.author.avatar}
							username={post.author.username}
							size="md"
						/>
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
					<h1 className="text-xl font-bold leading-snug text-zinc-50">
						{post.title}
					</h1>
				</div>

				{/* Image */}
				{post.imageLink && <PostImage src={post.imageLink} alt={post.title} />}

				{/* Title + body */}
				<div className="px-5 py-5">
					<p className="mt-3 text-sm leading-relaxed text-zinc-400">
						{post.content}
					</p>
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
						<MessageSquare size={13} /> {totalCommentCount} comment
						{totalCommentCount === 1 ? "" : "s"}
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
			{(comments.length > 0 || hasMoreTop || loadingTop) && (
				<div className="mt-8">
					<p className="mb-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
						{totalCommentCount} comment{totalCommentCount === 1 ? "" : "s"}
					</p>

					<div className="flex flex-col gap-3">
						{comments.map((c) => (
							<CommentItem
								key={c.id}
								comment={c}
								depth={0}
								postId={post_id}
								onReply={handleCommentTreeUpdate}
							/>
						))}
					</div>

					{hasMoreTop && (
						<button
							onClick={loadMoreTopComments}
							className="mt-4 w-full rounded-md border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
						>
							{loadingTop ? "Loading..." : "Load more comments"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

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
	const currentUser = useAuthStore((state) => state.user);
	const [content, setContent] = useState(comment.content);
	const [score, setScore] = useState(comment.likes);
	const [vote, setVote] = useState(null);
	const [repliesVisible, setRepliesVisible] = useState(false);
	const [repliesInitialized, setRepliesInitialized] = useState(false);
	const [repliesLoading, setRepliesLoading] = useState(false);
	const [replies, setReplies] = useState([]);
	const [replyOffset, setReplyOffset] = useState(0);
	const [hasMoreReplies, setHasMoreReplies] = useState(true);
	const [showReply, setShowReply] = useState(false);
	const [replyText, setReplyText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const canDeleteComment = canDeleteCommentForUser(
		currentUser,
		comment.userId,
		content,
	);

	useEffect(() => {
		setContent(comment.content);
	}, [comment.content]);

	function castVote(dir) {
		setVote((prev) => {
			const removing = prev === dir;
			setScore(
				removing ? comment.likes : comment.likes + (dir === "up" ? 1 : -1),
			);
			if (removing) {
				api.unlikeComment(comment.id).catch(() => {});
			} else {
				api.likeComment(comment.id).catch(() => {});
			}
			return removing ? null : dir;
		});
	}

	async function loadReplies(nextOffset = 0) {
		if (repliesLoading) return;
		setRepliesLoading(true);
		try {
			const res = await api.getComments(postId, nextOffset, comment.id);
			const list = (Array.isArray(res) ? res : []).map((item) =>
				normalizeComment(item),
			);
			if (nextOffset === 0) {
				setReplies(list);
			} else {
				setReplies((prev) => [...prev, ...list]);
			}
			setReplyOffset(nextOffset + list.length);
			setHasMoreReplies(list.length >= COMMENTS_LIMIT);
			setRepliesInitialized(true);
		} catch {
			setHasMoreReplies(false);
		} finally {
			setRepliesLoading(false);
		}
	}

	async function toggleReplies() {
		if (repliesVisible) {
			setRepliesVisible(false);
			return;
		}

		if (!repliesInitialized) {
			await loadReplies(0);
		}
		setRepliesVisible(true);
	}

	async function handleDeleteComment() {
		if (!canDeleteComment || isDeleting) return;
		setIsDeleting(true);
		try {
			await api.deleteComment(comment.id);
			setContent("[Delete]");
			onReply?.({ type: "delete", commentId: comment.id });
		} catch {
			// leave current UI unchanged when delete fails
		} finally {
			setIsDeleting(false);
		}
	}

	function handleCommentUpdate(update) {
		if (update?.type === "delete" && update.commentId) {
			setReplies((prev) => markCommentDeleted(prev, update.commentId));
		}
		onReply?.(update);
	}

	async function handleSubmitReply() {
		try {
			const reply = await api.createComment({
				post_id: postId,
				body: replyText.trim(),
				parent_id: comment.id,
			});
			const normalized = normalizeComment(reply);
			setReplies((prev) => [normalized, ...prev]);
			setRepliesVisible(true);
			setRepliesInitialized(true);
			setReplyOffset((v) => v + 1);
			onReply?.(normalized);
		} catch {}
		setShowReply(false);
		setReplyText("");
	}

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
					<Avatar
						src={comment.author.avatar}
						username={comment.author.username}
						size="sm"
					/>
					<div className="min-w-0 flex-1">
						{/* Header */}
						<div className="flex items-baseline gap-2">
							<Link
								href={`/profile/${comment.author.id}`}
								className="text-xs font-semibold text-zinc-300 transition-colors hover:text-zinc-100"
							>
								@{comment.author.username}
							</Link>
							<span className="text-xs text-zinc-600">
								{timeAgo(comment.createdAt)}
							</span>
						</div>

						{/* Content */}
						<p className="mt-1 text-sm leading-relaxed text-zinc-400">
							{content}
						</p>

						{/* Action row */}
						<div className="mt-2 flex flex-wrap items-center gap-3">
							{/* Vote */}
							<div className="flex items-center gap-1">
								<button
									onClick={() => castVote("up")}
									className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
										vote === "up"
											? "text-teal-400"
											: "text-zinc-600 hover:text-zinc-300"
									}`}
								>
									<ArrowUp size={11} />
								</button>
								<span
									className={`text-xs font-medium tabular-nums ${
										vote === "up"
											? "text-teal-400"
											: vote === "down"
												? "text-red-400"
												: "text-zinc-500"
									}`}
								>
									{score}
								</span>
								<button
									onClick={() => castVote("down")}
									className={`rounded p-0.5 transition-colors hover:bg-zinc-800 ${
										vote === "down"
											? "text-red-400"
											: "text-zinc-600 hover:text-zinc-300"
									}`}
								>
									<ArrowDown size={11} />
								</button>
							</div>

							{/* Reply — available at every depth */}
							<button
								onClick={() => setShowReply((v) => !v)}
								className={`flex items-center gap-1 text-xs transition-colors ${
									showReply
										? "text-teal-400"
										: "text-zinc-600 hover:text-zinc-300"
								}`}
							>
								<Reply size={11} /> Reply
							</button>

							{canDeleteComment && (
								<button
									onClick={handleDeleteComment}
									disabled={isDeleting}
									className="flex items-center gap-1 text-xs text-red-400/80 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
								>
									<Trash2 size={11} />
									{isDeleting ? "Deleting..." : "Delete"}
								</button>
							)}

							{/* Load / hide replies */}
							{!(
								repliesInitialized &&
								replies.length === 0 &&
								!repliesLoading
							) && (
								<button
									onClick={toggleReplies}
									className="ml-auto flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
								>
									<ChevronDown
										size={11}
										className={`transition-transform duration-150 ${repliesVisible ? "rotate-180" : ""}`}
									/>
									{repliesLoading
										? "Loading..."
										: repliesVisible
											? "Hide replies"
											: "View replies"}
								</button>
							)}
						</div>

						{/* Inline reply input */}
						{showReply && (
							<div className="mt-2.5 flex items-start gap-2">
								<input
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									placeholder="Write a reply…"
									className={`${AUTH_FIELD_CLASS} flex-1 py-1.5 text-xs`}
								/>
								{replyText.trim() && (
									<button
										onClick={handleSubmitReply}
										className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
									>
										Reply
									</button>
								)}
								<button
									onClick={() => {
										setShowReply(false);
										setReplyText("");
									}}
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
			{repliesVisible && replies.length > 0 && (
				<div className="ml-4 mt-1.5 flex flex-col gap-1.5 border-l border-zinc-800 pl-2">
					{replies.map((r) => (
						<CommentItem
							key={r.id}
							comment={r}
							depth={depth + 1}
							postId={postId}
							onReply={handleCommentUpdate}
						/>
					))}
					{hasMoreReplies && (
						<button
							onClick={() => loadReplies(replyOffset)}
							className="self-start rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
						>
							{repliesLoading ? "Loading..." : "Load more replies"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
