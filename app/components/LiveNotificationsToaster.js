"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuthStore } from "@/store/authStore";

function getNotifWsUrl() {
  if (globalThis.window === undefined) return "";

  const explicit = process.env.NEXT_PUBLIC_NOTIF_WS_URL;
  if (explicit) return explicit;

  // Connect directly to NotificationService — Next.js rewrites() are HTTP-only
  // and do not proxy WebSocket upgrade requests.  Browsers send localhost cookies
  // to any localhost port (SameSite=Lax, same registrable domain), so the
  // access_token cookie is included and authentication works.
  const protocol = globalThis.window.location.protocol === "https:" ? "wss" : "ws";
  const host = globalThis.window.location.hostname;
  return `${protocol}://${host}:8002/api/v1/notifications/ws/live`;
}

function toMessage(n) {
  const actor = n.publisher_name || "Someone";
  const title = n.post_title || "your post";

  if (n.type === "mention") return `${actor} mentioned you. Check /notifications for details.`;
  if (n.type === "reply") return `${actor} replied to your comment on "${title}".`;
  if (n.type === "comment") return `${actor} commented on "${title}".`;
  if (n.type === "like") return `${actor} liked "${title}".`;
  return `${actor} sent a new notification.`;
}

function showNotificationToast(router, n) {
  toast.info(toMessage(n), {
    toastId: n.id,
    autoClose: 5500,
    onClick: () => router.push("/notifications"),
  });
}

function parseNotificationMessage(raw) {
  try {
    const payload = JSON.parse(raw);
    return payload?.notification ?? null;
  } catch {
    return null;
  }
}

export default function LiveNotificationsToaster() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isReady = useAuthStore((s) => s._hydrated);

  const wsUrl = useMemo(() => getNotifWsUrl(), []);

  useEffect(() => {
    if (!isReady || !user?.id || !wsUrl) return;

    let ws;
    let retryTimer;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // keepalive ping so server receive loop stays active across proxies
        ws.send("ping");
      };

      ws.onmessage = (event) => {
        const n = parseNotificationMessage(event.data);
        if (!n || String(n.user_id) !== String(user.id)) return;
        showNotificationToast(router, n);
      };

      ws.onclose = () => {
        retryTimer = globalThis.setTimeout(connect, 2500);
      };
    };

    connect();

    return () => {
      if (retryTimer) globalThis.clearTimeout(retryTimer);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isReady, router, user?.id, wsUrl]);

  if (!isReady || !user?.id) return null;

  return (
    <ToastContainer
      position="bottom-right"
      newestOnTop
      pauseOnFocusLoss={false}
      closeOnClick
      theme="dark"
    />
  );
}
