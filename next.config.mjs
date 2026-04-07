/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	reactCompiler: true,
	skipTrailingSlashRedirect: true,
	async rewrites() {
		const AUTH = process.env.AUTH_URL || "http://localhost:8001";
		const POST = process.env.POST_URL || "http://localhost:8003";
		const FEED = process.env.FEED_URL || "http://localhost:8004";
		const NOTIF = process.env.NOTIF_URL || "http://localhost:8002";
		return [
			{
				source: "/api/v1/posts",
				destination: `${POST}/api/v1/posts/`,
			},
			{
				source: "/api/v1/posts/comments",
				destination: `${POST}/api/v1/posts/comments/`,
			},
			{
				source: "/api/v1/free_auth/:path*",
				destination: `${AUTH}/api/v1/free_auth/:path*`,
			},
			{
				source: "/api/v1/auth/:path*",
				destination: `${AUTH}/api/v1/auth/:path*`,
			},
			{
				source: "/api/v1/posts/:path*",
				destination: `${POST}/api/v1/posts/:path*`,
			},
			{
				source: "/api/v1/feed/:path*",
				destination: `${FEED}/api/v1/feed/:path*`,
			},
			{
				source: "/api/v1/notifications/:path*",
				destination: `${NOTIF}/api/v1/notifications/:path*`,
			},
		];
	},
};

export default nextConfig;
