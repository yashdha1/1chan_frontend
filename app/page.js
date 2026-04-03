import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-zinc-950 px-6 text-zinc-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">1chan</h1>
        <p className="mt-2 text-sm text-zinc-500"></p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Link
          href="/login"
          className="rounded-md bg-zinc-100 py-2.5 text-center text-sm font-medium text-zinc-950 transition hover:bg-white"
        >
          LOGIN
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-zinc-800 py-2.5 text-center text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900/80"
        >
          SIGNUP
        </Link>
      </div>
    </div>
  );
}
