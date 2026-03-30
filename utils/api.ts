const BASE = '';

const getToken = () => localStorage.getItem('fittrack_token') || '';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { headers: headers() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  post: async (path: string, body: unknown) => {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  delete: async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};
