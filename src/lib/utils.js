/**
 * Returns a human-readable relative time string for an ISO timestamp.
 * e.g. "just now", "5m ago", "3h ago", "2d ago"
 */
export function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Uppercase first letter of a string (for avatar initials). */
export function initial(name = "?") {
  return (name[0] ?? "?").toUpperCase();
}
