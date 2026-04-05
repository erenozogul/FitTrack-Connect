const BASE = '';

const getToken = () => localStorage.getItem('fittrack_token') || '';
const getRefreshToken = () => localStorage.getItem('fittrack_refresh_token') || '';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});


// Attempt to refresh the access token using the stored refresh token
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const tryRefresh = (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: getRefreshToken() }),
  })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      localStorage.setItem('fittrack_token', data.token);
      if (data.refreshToken) localStorage.setItem('fittrack_refresh_token', data.refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => { isRefreshing = false; refreshPromise = null; });
  return refreshPromise;
};

const request = async (path: string, init: RequestInit): Promise<any> => {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry with new token
      const retryInit = { ...init, headers: { ...init.headers, Authorization: `Bearer ${getToken()}` } };
      const retryRes = await fetch(`${BASE}${path}`, retryInit);
      if (!retryRes.ok) throw await retryRes.json();
      return retryRes.json();
    }
  }
  if (!res.ok) throw await res.json();
  return res.json();
};

export const api = {
  get: (path: string) => request(path, { headers: headers() }),
  post: (path: string, body: unknown) => request(path, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) => request(path, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE', headers: headers() }),
};
