// Lightweight JWT expiry check — this does NOT verify the signature (that's
// the backend's job on every request); it just tells a stale/expired token
// apart from a usable one so the app doesn't render the dashboard shell for
// a token nothing will actually authenticate against.
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" && decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
