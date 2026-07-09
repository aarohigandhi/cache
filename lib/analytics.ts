import { authFetch } from "./authFetch";

export function track(eventType: string, metadata?: Record<string, unknown>) {
  authFetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, metadata }),
  }).catch(() => {
    // Analytics failures shouldn't disrupt the product experience.
  });
}
