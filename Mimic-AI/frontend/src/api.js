// API helper for making authenticated requests to the backend.
// In production, requests go directly to the Render backend URL.
// In local dev, requests use relative URLs (handled by Vite proxy).

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the stored user from localStorage.
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('chatapp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Make an authenticated API request.
 * Sends user_id as a header so the backend can identify the user
 * without relying on cookies (which don't work cross-origin).
 */
export async function apiFetch(path, options = {}) {
  const user = getStoredUser();
  const headers = { ...(options.headers || {}) };

  if (user) {
    headers['X-User-Id'] = String(user.id);
  }

  const url = `${API_URL}${path}`;
  return fetch(url, { ...options, headers });
}
