import Link from "next/link";
import { MOCK_USERS, CURRENT_USER, postsByUser } from "@/lib/mockData";
import PostCard from "../../components/PostCard";
import Avatar from "../../components/Avatar";

const ROLE_BADGE = {
  admin: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  mod: "bg-teal-500/15 text-teal-400 border border-teal-500/20",
  user: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

export default async function ProfilePage({ params }) {
  const { user_id } = await params;
  const user = MOCK_USERS.find((u) => u.id === user_id) ?? MOCK_USERS[0];
  const posts = postsByUser(user.id);
  const isOwn = user.id === CURRENT_USER.id;
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Profile header */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-5">
          <Avatar username={user.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-50">{user.username}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ROLE_BADGE[user.role]}`}
              >
                {user.role}
              </span>
            </div>
            {user.bio ? (
              <p className="mt-1.5 text-sm text-zinc-400">{user.bio}</p>
            ) : (
              <p className="mt-1.5 text-sm italic text-zinc-600">No bio yet.</p>
            )}
            <div className="mt-4 flex items-center gap-6">
              <Stat label="Posts" value={posts.length} />
              <Stat label="Likes received" value={totalLikes} />
            </div>
          </div>
          {isOwn && (
            <Link
              href="/profile/edit"
              className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Edit profile
            </Link>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
          Posts by {user.username}
        </p>
        {posts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800/60 py-10 text-center">
            <p className="text-sm text-zinc-600">No posts yet.</p>
          </div>
        )}
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
