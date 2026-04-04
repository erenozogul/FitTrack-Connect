
export interface AppNotification {
  id: string;
  type: 'assignment' | 'message' | 'note' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const apiHeaders = () => {
  const token = localStorage.getItem('fittrack_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// Fetch from API, fall back to localStorage
export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const res = await fetch('/api/notifications', { headers: apiHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch { /* ignore */ }
  // fallback: localStorage
  try { return JSON.parse(localStorage.getItem('fittrack_notifications') || '[]'); } catch { return []; }
};

// Sync version for components that can't await (uses localStorage cache)
export const getNotificationsSync = (): AppNotification[] => {
  try { return JSON.parse(localStorage.getItem('fittrack_notifications') || '[]'); } catch { return []; }
};

export const addNotification = async (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  // Save to localStorage immediately (optimistic)
  const notif: AppNotification = { ...n, id: Date.now().toString(), time, read: false };
  const list = getNotificationsSync();
  localStorage.setItem('fittrack_notifications', JSON.stringify([notif, ...list].slice(0, 50)));
  // Persist to DB
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ type: n.type, title: n.title, body: n.body }),
    });
  } catch { /* localStorage already has it */ }
};

export const markAllRead = async () => {
  const list = getNotificationsSync().map(n => ({ ...n, read: true }));
  localStorage.setItem('fittrack_notifications', JSON.stringify(list));
  try {
    await fetch('/api/notifications/read', { method: 'PATCH', headers: apiHeaders() });
  } catch { /* ignore */ }
};

export const getUnreadCount = (): number => getNotificationsSync().filter(n => !n.read).length;
