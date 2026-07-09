/**
 * api.js — stub retained for import compatibility.
 * All auth is now handled in AuthContext (simulated, no network).
 * safeFetch is kept for any non-auth data fetching (ScamChecker, etc.)
 */
export const safeFetch = async (url, options = {}) => {
  const response = await fetch(url, options);

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    if (isJson) {
      try {
        const body = await response.json();
        errorMessage = body.error || body.message || errorMessage;
      } catch { /* ignore */ }
    }
    throw new Error(errorMessage);
  }

  return isJson ? response.json() : response.text();
};
