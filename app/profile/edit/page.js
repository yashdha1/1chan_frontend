"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, uploadToCloudinary } from "@/lib/api";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import { useAuthStore } from "@/store/authStore";
import Avatar from "../../components/Avatar";

export default function EditProfilePage() {
	const router = useRouter();
	const currentUser = useAuthStore((s) => s.user);
	const updateProfile = useAuthStore((s) => s.updateProfile);

	const [form, setForm] = useState({ username: "", bio: "", avatar: "" });
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	// Load current profile
	useEffect(() => {
		if (!currentUser?.username) return;
		api
			.getProfile(currentUser.username)
			.then((p) =>
				setForm({
					username: p.username ?? "",
					bio: p.bio ?? "",
					avatar: p.avatar ?? "",
				}),
			)
			.catch(() => {});
	}, [currentUser?.username]);

	function handleChange(e) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
		setError("");
		setSuccess(false);
	}

	useEffect(() => {
		return () => {
			if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		};
	}, [avatarPreview]);

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
		setSuccess(false);
	}

	function clearAvatar() {
		if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		setAvatarPreview("");
		setAvatarFile(null);
		setForm((prev) => ({ ...prev, avatar: "" }));
		setError("");
		setSuccess(false);
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
				const userId = currentUser?.id ?? crypto.randomUUID();
				const upload = await uploadToCloudinary(avatarFile, userId);
				avatarUrl = upload.secure_url ?? upload.url ?? avatarUrl;
			}

			const updated = await api.updateProfile({
				username: form.username.trim(),
				bio: form.bio.trim(),
				avatar: avatarUrl,
			});
			updateProfile({
				username: updated.username,
				avatar: updated.avatar ?? null,
			});
			setForm((prev) => ({ ...prev, avatar: updated.avatar ?? avatarUrl }));
			if (avatarPreview) URL.revokeObjectURL(avatarPreview);
			setAvatarPreview("");
			setAvatarFile(null);
			setSuccess(true);
		} catch (e) {
			setError(e.message ?? "Failed to save.");
		} finally {
			setIsUploadingAvatar(false);
			setIsLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-lg px-4 py-10">
			<button
				onClick={() => router.back()}
				className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
			>
				<ArrowLeft size={13} /> Back
			</button>

			<h1 className="mb-6 text-lg font-semibold text-zinc-100">Edit profile</h1>

			<div className="mb-6 flex items-center gap-4">
				<Avatar
					src={avatarPreview || form.avatar || null}
					username={form.username || currentUser?.username || "?"}
					size="lg"
				/>
				<div>
					<p className="text-sm font-medium text-zinc-300">
						{form.username || currentUser?.username}
					</p>
					<p className="text-xs text-zinc-600">
						Choose an image and we will upload it to Cloudinary.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-5">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="edit-username" className="text-xs text-zinc-500">
						Username
					</label>
					<input
						id="edit-username"
						type="text"
						name="username"
						value={form.username}
						onChange={handleChange}
						placeholder="username"
						className={AUTH_FIELD_CLASS}
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="edit-bio" className="text-xs text-zinc-500">
						Bio <span className="text-zinc-700">(optional)</span>
					</label>
					<textarea
						id="edit-bio"
						name="bio"
						value={form.bio}
						onChange={handleChange}
						placeholder="Tell us about yourself…"
						rows={4}
						className={`${AUTH_FIELD_CLASS} resize-none`}
					/>
					<span className="text-right text-xs text-zinc-600">
						{form.bio.length}/160
					</span>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="edit-avatar" className="text-xs text-zinc-500">
						Avatar Image{" "}
						<span className="text-zinc-700">(optional, max 5 MB)</span>
					</label>
					<input
						id="edit-avatar"
						type="file"
						accept="image/*"
						onChange={handleAvatarFileChange}
						className={AUTH_FIELD_CLASS}
					/>
					{avatarPreview && (
						<span className="text-xs text-zinc-500">New avatar selected.</span>
					)}
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
				{success && <p className="text-xs text-teal-400">Profile updated.</p>}

				<button
					type="submit"
					disabled={isLoading || isUploadingAvatar}
					className={`${AUTH_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
				>
					{isUploadingAvatar
						? "Uploading avatar..."
						: isLoading
							? "Saving..."
							: "Save changes"}
				</button>
			</form>
		</div>
	);
}
