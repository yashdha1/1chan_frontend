import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // always send cookies (access_token, refresh_token)
});


export function setAccessToken(_token) {}

// Auto-refresh on 401 
// just call the /refresh endpoint :
let refreshing = null;
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (
      err.response?.status !== 401 ||
      err.config._retry ||
      err.config.url?.includes("/free_auth/")
    ) {
      return Promise.reject(err);
    }
    err.config._retry = true;
    try {
      if (!refreshing) {
        refreshing = client
          .post("/free_auth/refresh")
          .finally(() => { refreshing = null; });
      }
      await refreshing;
      return client(err.config);
    } catch {
      return Promise.reject(err);
    }
  },
);
 

export function parseJwt(token) {
  try {
    const b64 = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
}

async function apiFetch(path, opts = {}) {
  const { method = "GET", body, ...rest } = opts;
  try {
    const res = await client.request({ url: path, method, data: body, ...rest });
    return res.status === 204 ? null : res.data;
  } catch (err) {
    const detail = err.response?.data?.detail;
    throw new Error(detail ?? `${err.response?.status ?? err.message}`);
  }
}

export function normalizePost(p) {
  return {
    id: String(p.post_id),
    author: { id: p.user_name, username: p.user_name, avatar: p.user_avatar ?? null },
    community: { id: "general", name: p.tags?.[0] ?? "general" },
    title: p.title,
    content: p.body,
    imageLink: p.image_link ?? null,
    likes: p.like_count ?? 0,
    commentCount: p.comment_count ?? 0,
    createdAt: p.created_at ?? new Date().toISOString(),
  };
}

export function normalizeComment(c) {
  return {
    id: String(c.comment_id),
    author: { id: c.user_name, username: c.user_name, avatar: c.user_avatar ?? null },
    content: c.body,
    createdAt: c.created_at ?? new Date().toISOString(),
    likes: c.like_count ?? 0,
    replies: [],
  };
}

export async function uploadToCloudinary(file, userId) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", "avatars");
  form.append("public_id", userId);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Avatar upload failed");
  }
  return await res.json();
}

 
export const api = {

  login: (username, password) =>
    apiFetch("/free_auth/login", { method: "POST", body: { username, password } }),
  register: (payload) =>
    apiFetch("/free_auth/register", { method: "POST", body: payload }),
  refresh: () =>
    apiFetch("/free_auth/refresh", { method: "POST" }),

  // auth (protected) 
  logout: () =>
    apiFetch("/auth/logout", { method: "POST" }),
  getProfile: async (username) => {
    const res = await apiFetch(`/auth/profile/${encodeURIComponent(username)}`);
    return res?.user ?? res;
  },
  updateProfile: (data) =>
    apiFetch("/auth/profile", { method: "PATCH", body: data }).then((r) => r?.user ?? r),
  deleteOwnProfile: () =>
    apiFetch("/auth/profile", { method: "DELETE" }),
 
  getUsers: (role = "all") =>
    apiFetch(`/auth/admin/users/${role}`),
  updateUserRole: (userId, newRole) =>
    apiFetch(`/auth/admin/users/${userId}/${newRole}`, { method: "PATCH" }),
  deleteUser: (userId) =>
    apiFetch(`/auth/admin/users/${userId}`, { method: "DELETE" }),

  // posts
  getPost: (id) =>
    apiFetch(`/posts/${id}`),
  getUserPosts: (username) =>
    apiFetch(`/posts/user/${encodeURIComponent(username)}`),

  createPost: (data) =>
    apiFetch("/posts", { method: "POST", body: data }),
  updatePost: (id, data) =>
    apiFetch(`/posts/${id}`, { method: "PATCH", body: data }),
  deletePost: (id) =>
    apiFetch(`/posts/${id}`, { method: "DELETE" }),
  searchPosts: (query) =>
    apiFetch("/posts/search", { method: "POST", body: { query } }),
  likePost: (id) =>
    apiFetch(`/posts/${id}/like`, { method: "POST" }),
  unlikePost: (id) =>
    apiFetch(`/posts/${id}/unlike`, { method: "POST" }),


  getComments: (postId, offset = 0, parentId = null) =>
    apiFetch(`/posts/comments/${postId}`, {
      params: { offset, ...(parentId ? { parent_id: parentId } : {}) },
    }),
  createComment: (data) =>
    apiFetch("/posts/comments/", { method: "POST", body: data }),
  deleteComment: (commentId) =>
    apiFetch(`/posts/comments/${commentId}`, { method: "DELETE" }),
  likeComment: (commentId) =>
    apiFetch("/posts/comments/like", { method: "POST", body: { comment_id: commentId } }),
  unlikeComment: (commentId) =>
    apiFetch("/posts/comments/unlike", { method: "POST", body: { comment_id: commentId } }),


  generateFeed: (feed_type = "suggested") =>
    apiFetch(`/feed/generate_feed/${feed_type}`),
  getTags: () =>
    apiFetch("/feed/operation/get_tags"),
  recordViewed: (body) =>
    apiFetch("/feed/operation/viewed_posts", { method: "POST", body }),
  updateWeights: (action) =>
    apiFetch("/feed/operation/update_weights", { method: "POST", body: action }),
  addTag: (tag) =>
    apiFetch("/feed/operation/add_tag", { method: "POST", body: tag }),


  getNotifications: (offset = 0) =>
    apiFetch(`/notifications/activity/${offset}`, { method: "POST" }),
  markRead: (id) =>
    apiFetch("/notifications/mark", { method: "POST", body: { notification_id: id } }),
};
