/** Returns the `?next=` path when it is a safe same-site path, otherwise the fallback. */
export function nextPath(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
