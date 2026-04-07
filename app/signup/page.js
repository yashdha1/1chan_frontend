"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import { useSignupForm } from "@/store/signupStore";
import AuthSplitLayout from "../components/AuthSplitLayout";

export default function SignupPage() {
	const fileInputRef = useRef(null);
	const {
		step,
		username,
		password,
		avatarLink,
		bio,
		errors,
		isLoading,
		submitError,
		setUsername,
		setPassword,
		setBio,
		setStep,
		goToStep2,
		setAvatarFromFile,
		clearAvatarLink,
		register,
		reset,
	} = useSignupForm();

	useEffect(() => () => reset(), [reset]);

	async function handleSubmit(e) {
		e.preventDefault();
		if (step === 1) goToStep2();
		else await register();
	}

	function handleAvatarChange(e) {
		const file = e.target.files?.[0];
		if (file) setAvatarFromFile(file);
	}

	return (
		<AuthSplitLayout>
			<div className="flex flex-col gap-8">
				<header>
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
						1chan
					</p>
					<h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
						Create account
					</h1>
					<p className="mt-1 text-sm text-zinc-500">
						{step === 1 ? "Credentials" : "Profile"}
					</p>
					<div className="mt-4 flex gap-1.5" aria-hidden>
						<span
							className={`h-0.5 flex-1 rounded-full ${step >= 1 ? "bg-zinc-200" : "bg-zinc-800"}`}
						/>
						<span
							className={`h-0.5 flex-1 rounded-full ${step >= 2 ? "bg-zinc-200" : "bg-zinc-800"}`}
						/>
					</div>
				</header>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					{step === 1 ? (
						<>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="signup-username"
									className="text-xs text-zinc-500"
								>
									Username
								</label>
								<input
									id="signup-username"
									type="text"
									autoComplete="username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="username"
									className={AUTH_FIELD_CLASS}
								/>
								{errors.username && (
									<p className="text-xs text-red-400">{errors.username}</p>
								)}
							</div>

							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="signup-password"
									className="text-xs text-zinc-500"
								>
									Password
								</label>
								<input
									id="signup-password"
									type="password"
									autoComplete="new-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="At least 8 characters"
									className={AUTH_FIELD_CLASS}
								/>
								{errors.password && (
									<p className="text-xs text-red-400">{errors.password}</p>
								)}
							</div>

							<button
								type="submit"
								className={`mt-1 ${AUTH_PRIMARY_BUTTON_CLASS}`}
							>
								Continue
							</button>
						</>
					) : (
						<>
							<div className="flex flex-col items-center gap-3">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition-colors"
									style={
										avatarLink
											? {
													backgroundImage: `url(${avatarLink})`,
													backgroundSize: "cover",
													backgroundPosition: "center",
												}
											: undefined
									}
								>
									{!avatarLink && <span className="text-xs">Add photo</span>}
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={handleAvatarChange}
								/>
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline underline-offset-4"
									>
										Upload
									</button>
									{avatarLink && (
										<button
											type="button"
											onClick={() => {
												clearAvatarLink();
												if (fileInputRef.current)
													fileInputRef.current.value = "";
											}}
											className="text-xs text-zinc-600 hover:text-zinc-400"
										>
											Remove
										</button>
									)}
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<label htmlFor="signup-bio" className="text-xs text-zinc-500">
									Bio <span className="text-zinc-700">(optional)</span>
								</label>
								<textarea
									id="signup-bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder="Tell us a little about yourself"
									rows={3}
									className={`${AUTH_FIELD_CLASS} resize-none`}
								/>
								<span className="text-right text-xs text-zinc-600">
									{bio.length}/160
								</span>
							</div>

							{submitError && (
								<p className="text-xs text-red-400">{submitError}</p>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className={`${AUTH_PRIMARY_BUTTON_CLASS} disabled:opacity-60 disabled:cursor-not-allowed`}
							>
								{isLoading ? "Creating..." : "Create account"}
							</button>
							<button
								type="button"
								onClick={() => setStep(1)}
								className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
							>
								Back
							</button>
						</>
					)}
				</form>

				<p className="text-center text-xs text-zinc-600">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</AuthSplitLayout>
	);
}
