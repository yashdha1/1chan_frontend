"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/authUi";
import { useAuthStore } from "@/store/authStore";
import AuthSplitLayout from "../components/AuthSplitLayout";

export default function LoginPage() {
	const [form, setForm] = useState({ username: "", password: "" });
	const [localError, setLocalError] = useState("");

	const login = useAuthStore((s) => s.login);
	const isLoading = useAuthStore((s) => s.isLoading);
	const storeError = useAuthStore((s) => s.error);
	const setStoreError = useAuthStore((s) => s.setError);

	function handleChange(e) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
		setLocalError("");
		setStoreError(null);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.username || !form.password) {
			setLocalError("Please fill in all fields.");
			return;
		}
		await login(form.username, form.password);
	}

	const displayError = localError || storeError;

	return (
		<AuthSplitLayout>
			<div className="flex flex-col gap-8">
				<header>
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
						1chan
					</p>
					<h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
						Sign in
					</h1>
					<p className="mt-1 text-sm text-zinc-500">Welcome back.</p>
				</header>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="login-username" className="text-xs text-zinc-500">
							Username
						</label>
						<input
							id="login-username"
							type="text"
							name="username"
							autoComplete="username"
							value={form.username}
							onChange={handleChange}
							placeholder="yourusername"
							className={AUTH_FIELD_CLASS}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="login-password" className="text-xs text-zinc-500">
							Password
						</label>
						<input
							id="login-password"
							type="password"
							name="password"
							autoComplete="current-password"
							value={form.password}
							onChange={handleChange}
							placeholder="••••••••"
							className={AUTH_FIELD_CLASS}
						/>
					</div>

					{displayError ? (
						<p className="text-xs text-red-400">{displayError}</p>
					) : null}

					<button
						type="submit"
						disabled={isLoading}
						className={`mt-1 ${AUTH_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
					>
						{isLoading ? "Signing in…" : "Sign in"}
					</button>
				</form>

				<p className="text-center text-xs text-zinc-600">
					No account?{" "}
					<Link
						href="/signup"
						className="text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		</AuthSplitLayout>
	);
}
