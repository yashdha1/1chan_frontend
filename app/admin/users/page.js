"use client";

import {
	ChevronDown,
	Search,
	Shield,
	SlidersHorizontal,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Avatar from "../../components/Avatar";

const ROLE_BADGE = {
	admin: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
	mod: "bg-teal-500/15 text-teal-400 border border-teal-500/20",
	user: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

const ROLE_ORDER = { admin: 0, mod: 1, user: 2 };

export default function AdminUsersPage() {
	const [allUsers, setAllUsers] = useState([]);
	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [expandedId, setExpandedId] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [actionError, setActionError] = useState("");

	useEffect(() => {
		api
			.getUsers("all")
			.then((res) => {
				setAllUsers(res ?? []);
				if (res?.length > 0) setSelectedId(res[0].id);
			})
			.catch(() => {});
	}, []);

	async function changeRole(userId, newRole) {
		setActionError("");
		try {
			const updated = await api.updateUserRole(userId, newRole);
			setAllUsers((prev) =>
				prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
			);
		} catch (e) {
			setActionError(e.message ?? "Failed to update role.");
		}
	}

	async function removeUser(userId) {
		setActionError("");
		try {
			await api.deleteUser(userId);
			setAllUsers((prev) => prev.filter((u) => u.id !== userId));
			setSelectedId(null);
		} catch (e) {
			setActionError(e.message ?? "Failed to delete user.");
		}
	}

	const filtered = allUsers
		.filter((u) => {
			const matchesQuery = u.email.toLowerCase().includes(query.toLowerCase());
			const matchesRole = roleFilter === "all" || u.role === roleFilter;
			return matchesQuery && matchesRole;
		})
		.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

	const selected = allUsers.find((u) => u.id === selectedId);

	return (
		<div className="flex flex-1" style={{ height: "calc(100vh - 3.5rem)" }}>
			{/* Left panel */}
			<aside className="flex w-72 shrink-0 flex-col border-r border-zinc-800">
				{/* Search + filter */}
				<div className="flex items-center gap-2 border-b border-zinc-800 p-3">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search users…"
							className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 py-1.5 pl-8 pr-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
						/>
					</div>
					<div className="relative">
						<button className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300">
							<SlidersHorizontal size={14} />
						</button>
					</div>
				</div>

				{/* Role filter tabs */}
				<div className="flex border-b border-zinc-800">
					{["all", "admin", "mod", "user"].map((r) => (
						<button
							key={r}
							onClick={() => setRoleFilter(r)}
							className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
								roleFilter === r
									? "border-b-2 border-teal-400 text-teal-400"
									: "text-zinc-600 hover:text-zinc-400"
							}`}
						>
							{r}
						</button>
					))}
				</div>

				{/* User list */}
				<ul className="flex-1 overflow-y-auto">
					{filtered.length === 0 && (
						<li className="p-4 text-center text-xs text-zinc-600">
							No users found.
						</li>
					)}
					{filtered.map((u) => {
						const isExpanded = expandedId === u.id;
						const isSelected = selectedId === u.id;
						return (
							<li key={u.id} className="border-b border-zinc-800/60">
								<button
									onClick={() => {
										setSelectedId(u.id);
										setExpandedId(isExpanded ? null : u.id);
									}}
									className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
										isSelected ? "bg-zinc-900" : "hover:bg-zinc-900/50"
									}`}
								>
									<Avatar username={u.email} size="sm" />
									<div className="flex-1 min-w-0">
										<p className="truncate text-sm text-zinc-200">{u.email}</p>
										<span
											className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[9px] font-medium uppercase tracking-wide ${ROLE_BADGE[u.role]}`}
										>
											{u.role}
										</span>
									</div>
									<ChevronDown
										size={13}
										className={`shrink-0 text-zinc-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
									/>
								</button>

								{/* Expanded: id */}
								{isExpanded && (
									<div className="border-t border-zinc-800/60 bg-zinc-950/50 px-4 py-2.5">
										<p className="text-[10px] text-zinc-600">{String(u.id)}</p>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			</aside>

			{/* Right panel — user detail */}
			<main className="flex-1 overflow-y-auto p-8">
				{selected ? (
					<div className="mx-auto max-w-md">
						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
							<div className="flex items-start gap-4">
								<Avatar username={selected.email} size="lg" />
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<p className="text-base font-semibold text-zinc-100">
											{selected.email}
										</p>
										<span
											className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ROLE_BADGE[selected.role]}`}
										>
											{selected.role}
										</span>
									</div>
									<p className="mt-1 text-xs text-zinc-600 font-mono">
										{selected.id}
									</p>
									<p className="mt-0.5 text-xs text-zinc-600">
										{selected.is_active ? "Active" : "Inactive"}
									</p>
								</div>
							</div>

							{actionError && (
								<p className="mt-3 text-xs text-red-400">{actionError}</p>
							)}

							{/* Role actions */}
							<div className="mt-6 border-t border-zinc-800 pt-5">
								<p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-600">
									Role management
								</p>
								<div className="flex flex-wrap gap-2">
									{selected.role !== "mod" && selected.role !== "admin" && (
										<ActionButton
											icon={<Shield size={13} />}
											label="Promote to mod"
											variant="teal"
											onClick={() => changeRole(selected.id, "mod")}
										/>
									)}
									{selected.role === "mod" && (
										<ActionButton
											icon={<User size={13} />}
											label="Demote to user"
											variant="zinc"
											onClick={() => changeRole(selected.id, "user")}
										/>
									)}
									{selected.role !== "admin" && (
										<ActionButton
											icon={<Shield size={13} />}
											label="Make admin"
											variant="violet"
											onClick={() => changeRole(selected.id, "admin")}
										/>
									)}
									{selected.role === "admin" && (
										<ActionButton
											icon={<User size={13} />}
											label="Demote to mod"
											variant="zinc"
											onClick={() => changeRole(selected.id, "mod")}
										/>
									)}
								</div>
							</div>

							{/* Danger zone */}
							<div className="mt-6 border-t border-zinc-800 pt-5">
								<p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-red-600">
									Danger
								</p>
								<ActionButton
									icon={<User size={13} />}
									label="Delete account"
									variant="danger"
									onClick={() => {
										if (
											confirm(
												`Delete ${selected.email}? This cannot be undone.`,
											)
										)
											removeUser(selected.id);
									}}
								/>
							</div>
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<p className="text-sm text-zinc-600">Select a user</p>
					</div>
				)}
			</main>
		</div>
	);
}

function ActionButton({ icon, label, variant, onClick }) {
	const variants = {
		teal: "border-teal-700 text-teal-400 hover:bg-teal-500/10",
		violet: "border-violet-700 text-violet-400 hover:bg-violet-500/10",
		zinc: "border-zinc-700 text-zinc-400 hover:bg-zinc-800",
		danger: "border-red-800 text-red-400 hover:bg-red-500/10",
	};
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${variants[variant]}`}
		>
			{icon}
			{label}
		</button>
	);
}
