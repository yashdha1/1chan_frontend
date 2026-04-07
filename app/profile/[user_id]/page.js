"use client";

/* eslint-disable react/prop-types, jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */

import { Image, Pencil, Tag, X } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import { api, normalizePost, uploadToCloudinary } from "@/lib/api";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import { useAuthStore } from "@/store/authStore";
import Avatar from "../../components/Avatar";
import PostCard from "../../components/PostCard";

const MAX_TAGS = 5;
const EMPTY_POST_FORM = { title: "", content: "" };

export default function ProfilePage({ params: paramsPromise }) {
	const params = use(paramsPromise);
	const [profile, setProfile] = useState(null);
	const [posts, setPosts] = useState([]);
	const [tags, setTags] = useState([]);
	const [error, setError] = useState(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editingPost, setEditingPost] = useState(null);
	const [adminTools, setAdminTools] = useState(false);
	const currentUser = useAuthStore((s) => s.user);
	const updateProfile = useAuthStore((s) => s.updateProfile);

	useEffect(() => {
		setError(null);
		api
			.getProfile(params.user_id)
			.then((p) => {
				setProfile(p);
				return api.getUserPosts(p.username);
			})
			.then((raw) => setPosts((raw ?? []).map(normalizePost)))
			.catch((e) => setError(e.message));
	}, [params.user_id]);

	useEffect(() => {
		api
			.getTags()
			.then((res) => setTags((res ?? []).map((tag) => tag.name)))
			.catch(() => {});
	}, []);

	function onSaved(updated) {
		setProfile((p) => ({ ...p, ...updated }));
		updateProfile({
			username: updated.username,
			avatar: updated.avatar ?? null,
		});
		setEditOpen(false);
	}

	function onPostSaved(updatedPost) {
		setPosts((currentPosts) =>
			currentPosts.map((post) =>
				post.id === updatedPost.id ? updatedPost : post,
			),
		);
		setEditingPost(null);
	}

	function onPostDeleted(postId) {
		setPosts((currentPosts) =>
			currentPosts.filter((post) => post.id !== postId),
		);
		setEditingPost(null);
	}

	if (error)
		return (
			<div className="py-20 text-center text-sm text-red-400">{error}</div>
		);
	if (!profile)
		return (
			<div className="py-20 text-center text-xs text-zinc-600">Loading…</div>
		);

	const isOwn = currentUser?.username === profile.username;
	const isAdmin = currentUser?.role === "admin";
	const totalLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);

	return (
		<div className="mx-auto max-w-2xl px-4 py-10">
			<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
				<div className="flex items-start gap-5">
					<Avatar src={profile.avatar} username={profile.username} size="lg" />
					<div className="flex-1 min-w-0">
						<h1 className="text-lg font-bold text-zinc-50">
							{profile.username}
						</h1>
						{profile.bio ? (
							<p className="mt-1.5 text-sm text-zinc-400">{profile.bio}</p>
						) : (
							<p className="mt-1.5 text-sm italic text-zinc-600">No bio yet.</p>
						)}
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
					{isOwn && isAdmin && (
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
				{posts.length > 0 ? (
					<div className="flex flex-col gap-3">
						{posts.map((post) => (
							<div key={post.id} className="flex flex-col gap-1.5">
								<PostCard post={post} />
								{isOwn && (
									<div className="flex justify-end">
										<button
											onClick={() => setEditingPost(post)}
											className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
										>
											<Pencil size={12} />
											Edit post
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-zinc-800/60 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{isOwn
								? "You haven't posted anything yet."
								: `${profile.username} hasn't posted anything yet.`}
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

			{editingPost && (
				<EditPostModal
					post={editingPost}
					availableTags={tags}
					currentUser={currentUser}
					onClose={() => setEditingPost(null)}
					onSaved={onPostSaved}
					onDelete={onPostDeleted}
				/>
			)}

			{adminTools && <AdminToolsModal onClose={() => setAdminTools(false)} />}
		</div>
	);
}

function EditModal({ profile, onClose, onSaved }) {
	const [form, setForm] = useState({
		username: profile.username ?? "",
		bio: profile.bio ?? "",
		avatar: profile.avatar ?? "",
	});
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [error, setError] = useState("");

	function handleChange(e) {
		setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
		setError("");
	}

	useEffect(
		() => () => {
			if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		},
		[avatarPreview],
	);

	function handleAvatarFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Choose an image file.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setError("Avatar image must be at most 5 MB.");
			return;
		}

		if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
		setError("");
	}

	function clearAvatar() {
		if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		setAvatarPreview("");
		setAvatarFile(null);
		setForm((p) => ({ ...p, avatar: "" }));
		setError("");
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.username.trim()) {
			setError("Username is required.");
			return;
		}
		setIsLoading(true);
		setError("");
		try {
			let avatarUrl = form.avatar.trim();

			if (avatarFile) {
				setIsUploadingAvatar(true);
				const upload = await uploadToCloudinary(
					avatarFile,
					profile.id ?? crypto.randomUUID(),
				);
				avatarUrl = upload.secure_url ?? upload.url ?? avatarUrl;
			}

			const updated = await api.updateProfile({
				username: form.username.trim(),
				bio: form.bio.trim(),
				avatar: avatarUrl,
			});
			onSaved(updated);
		} catch (e) {
			setError(e.message ?? "Failed to save.");
		} finally {
			setIsUploadingAvatar(false);
			setIsLoading(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
				<div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
					<p className="text-sm font-semibold text-zinc-200">Edit profile</p>
					<button
						onClick={onClose}
						className="rounded p-1 text-zinc-600 hover:text-zinc-300"
					>
						<X size={16} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
					<div className="flex items-center gap-3">
						<Avatar
							src={avatarPreview || form.avatar || null}
							username={form.username || profile.username}
							size="lg"
						/>
						<p className="text-sm font-medium text-zinc-300">
							{form.username || profile.username}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="profile-username" className="text-xs text-zinc-500">
							Username
						</label>
						<input
							id="profile-username"
							name="username"
							type="text"
							value={form.username}
							onChange={handleChange}
							placeholder="username"
							className={AUTH_FIELD_CLASS}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="profile-bio" className="text-xs text-zinc-500">
							Bio
						</label>
						<textarea
							id="profile-bio"
							name="bio"
							value={form.bio}
							onChange={handleChange}
							rows={3}
							placeholder="Tell us about yourself…"
							className={`${AUTH_FIELD_CLASS} resize-none`}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="profile-avatar" className="text-xs text-zinc-500">
							Avatar image (optional, max 5 MB)
						</label>
						<input
							id="profile-avatar"
							type="file"
							accept="image/*"
							onChange={handleAvatarFileChange}
							className={AUTH_FIELD_CLASS}
						/>
						{(avatarPreview || form.avatar) && (
							<button
								type="button"
								onClick={clearAvatar}
								className="w-fit text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
							>
								Remove avatar
							</button>
						)}
					</div>

					{error && <p className="text-xs text-red-400">{error}</p>}

					<div className="flex justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading || isUploadingAvatar}
							className={`${AUTH_PRIMARY_BUTTON_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
						>
							{isUploadingAvatar
								? "Uploading avatar..."
								: isLoading
									? "Saving..."
									: "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function EditPostModal({
	post,
	availableTags,
	currentUser,
	onClose,
	onSaved,
	onDelete,
}) {
	const [form, setForm] = useState({
		...EMPTY_POST_FORM,
		title: post.title ?? "",
		content: post.content ?? "",
	});
	const [selectedTags, setSelectedTags] = useState(post.tags ?? []);
	const [tagQuery, setTagQuery] = useState("");
	const [tagDropOpen, setTagDropOpen] = useState(false);
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(post.imageLink ?? null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef(null);
	const tagInputRef = useRef(null);

	useEffect(
		() => () => {
			if (imagePreview?.startsWith("blob:")) {
				URL.revokeObjectURL(imagePreview);
			}
		},
		[imagePreview],
	);

	const tagSuggestions = availableTags
		.filter(
			(tag) =>
				tagQuery &&
				tag.toLowerCase().includes(tagQuery.toLowerCase()) &&
				!selectedTags.includes(tag),
		)
		.slice(0, 6);

	function handleImageChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (imagePreview?.startsWith("blob:")) {
			URL.revokeObjectURL(imagePreview);
		}
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	}

	function resetImageSelection() {
		if (imagePreview?.startsWith("blob:")) {
			URL.revokeObjectURL(imagePreview);
		}
		setImageFile(null);
		setImagePreview(post.imageLink ?? null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function addTag(tag) {
		if (selectedTags.length >= MAX_TAGS) return;
		setSelectedTags((currentTags) => [...currentTags, tag]);
		setTagQuery("");
		setTagDropOpen(false);
		setError("");
		tagInputRef.current?.focus();
	}

	function removeTag(tag) {
		setSelectedTags((currentTags) =>
			currentTags.filter((currentTag) => currentTag !== tag),
		);
	}

	async function handleSubmit(e) {
		e.preventDefault();

		const title = form.title.trim();
		if (!title) {
			setError("Title is required.");
			return;
		}

		if (selectedTags.length === 0) {
			setError("Add at least one tag.");
			return;
		}

		setIsSaving(true);
		setError("");

		try {
			let image_link = post.imageLink ?? undefined;
			if (imageFile) {
				const result = await uploadToCloudinary(imageFile, crypto.randomUUID());
				image_link = result.secure_url;
			}

			const payload = {
				title,
				body: form.content.trim(),
				edited_by: currentUser?.username ?? "",
				tags: selectedTags,
			};

			if (image_link) {
				payload.image_link = image_link;
			}

			const updated = await api.updatePost(post.id, payload);
			onSaved(normalizePost(updated));
		} catch (e) {
			setError(e.message ?? "Failed to update post.");
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		setIsDeleting(true);
		setError("");

		try {
			await api.deletePost(post.id);
			onDelete(post.id);
		} catch (e) {
			setError(e.message ?? "Failed to delete post.");
			setIsDeleting(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
				<div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
					<p className="text-sm font-semibold text-zinc-200">Edit post</p>
					<button
						onClick={onClose}
						className="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-300"
					>
						<X size={16} />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
				>
					<input
						placeholder="Title"
						value={form.title}
						onChange={(e) => {
							setForm((currentForm) => ({
								...currentForm,
								title: e.target.value,
							}));
							setError("");
						}}
						className={AUTH_FIELD_CLASS}
						required
					/>

					<textarea
						placeholder="What's on your mind?"
						value={form.content}
						onChange={(e) => {
							setForm((currentForm) => ({
								...currentForm,
								content: e.target.value,
							}));
							setError("");
						}}
						rows={5}
						className={`${AUTH_FIELD_CLASS} resize-none`}
					/>

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
								<img
									src={imagePreview}
									alt={post.title}
									className="max-h-48 w-full object-cover"
								/>
								<button
									type="button"
									onClick={resetImageSelection}
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
						{imagePreview && (
							<div className="mt-2 flex justify-end">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
								>
									Replace image
								</button>
							</div>
						)}
					</div>

					<div>
						<p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
							<Tag size={12} /> Tags
							<span className="ml-auto text-zinc-600">
								{selectedTags.length}/{MAX_TAGS}
							</span>
						</p>

						{selectedTags.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-1.5">
								{selectedTags.map((tag) => (
									<span
										key={tag}
										className="flex items-center gap-1 rounded-full border border-teal-700/40 bg-teal-500/10 px-2.5 py-0.5 text-xs text-teal-400"
									>
										#{tag}
										<button
											type="button"
											onClick={() => removeTag(tag)}
											className="ml-0.5 opacity-60 hover:opacity-100"
										>
											<X size={10} />
										</button>
									</span>
								))}
							</div>
						)}

						{selectedTags.length < MAX_TAGS && (
							<div className="relative">
								<input
									ref={tagInputRef}
									type="text"
									value={tagQuery}
									onChange={(e) => {
										setTagQuery(e.target.value);
										setTagDropOpen(true);
									}}
									onFocus={() => tagQuery && setTagDropOpen(true)}
									onBlur={() => setTimeout(() => setTagDropOpen(false), 150)}
									placeholder="Search tags…"
									className={`${AUTH_FIELD_CLASS} text-xs`}
								/>
								{tagDropOpen && tagSuggestions.length > 0 && (
									<ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
										{tagSuggestions.map((tag) => (
											<li key={tag}>
												<button
													type="button"
													onMouseDown={() => addTag(tag)}
													className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
												>
													<span className="text-zinc-600">#</span>
													{tag}
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						)}
					</div>

					{error && <p className="text-xs text-red-400">{error}</p>}

					<div className="flex justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={handleDelete}
							disabled={isSaving || isDeleting}
							className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isDeleting ? "Deleting..." : "Delete Post"}
						</button>
						<button
							type="button"
							onClick={onClose}
							disabled={isSaving || isDeleting}
							className="rounded-md px-4 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSaving || isDeleting}
							className={`${AUTH_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
						>
							{isSaving ? "Saving…" : "Save changes"}
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
		api
			.getUsers("all")
			.then((res) => setUsers(res ?? []))
			.catch((e) => setActionMsg(e.message ?? "Failed to load users."))
			.finally(() => setUsersLoading(false));
	}, [tab]);

	async function handleRoleChange(userId, newRole) {
		setActionMsg("");
		try {
			const updated = await api.updateUserRole(userId, newRole);
			setUsers((prev) =>
				prev.map((u) =>
					u.id === userId ? { ...u, role: updated.role ?? newRole } : u,
				),
			);
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
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
				<div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
					<p className="text-sm font-semibold text-zinc-200">Admin Tools</p>
					<button
						onClick={onClose}
						className="rounded p-1 text-zinc-600 hover:text-zinc-300"
					>
						<X size={16} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-zinc-800">
					{["users", "tags"].map((t) => (
						<button
							key={t}
							onClick={() => {
								setTab(t);
								setActionMsg("");
								setTagMsg("");
							}}
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
							{usersLoading && (
								<p className="text-xs text-zinc-500">Loading…</p>
							)}
							{!usersLoading && users.length === 0 && (
								<p className="text-xs text-zinc-500">No users found.</p>
							)}
							<div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
								{users
									.filter((u) =>
										(u.username ?? u.email ?? "")
											.toLowerCase()
											.includes(userSearch.toLowerCase()),
									)
									.map((u) => (
										<div
											key={u.id}
											className="flex items-center gap-3 rounded-md border border-zinc-800 px-3 py-2"
										>
											<span className="flex-1 truncate text-sm text-zinc-300">
												{u.username ?? u.email}
											</span>
											<select
												value={u.role}
												onChange={(e) => handleRoleChange(u.id, e.target.value)}
												className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
											>
												{ROLES.map((r) => (
													<option key={r} value={r}>
														{r}
													</option>
												))}
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
							<label htmlFor="admin-new-tag" className="text-xs text-zinc-500">
								New tag name
							</label>
							<div className="flex gap-2">
								<input
									id="admin-new-tag"
									value={tag}
									onChange={(e) => {
										setTag(e.target.value);
										setTagMsg("");
									}}
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
								<p
									className={`text-xs ${tagMsg === "Tag added." ? "text-teal-400" : "text-red-400"}`}
								>
									{tagMsg}
								</p>
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
