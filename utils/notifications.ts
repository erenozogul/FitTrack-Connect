
export interface AppNotification {
  id: string;
  type: 'assignment' | 'message' | 'note' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const getNotifications = (): AppNotification[] => {
  try { return JSON.parse(localStorage.getItem('fittrack_notifications') || '[]'); } catch { return []; }
};

export const addNotification = (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
  const list = getNotifications();
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const notif: AppNotification = { ...n, id: Date.now().toString(), time, read: false };
  localStorage.setItem('fittrack_notifications', JSON.stringify([notif, ...list].slice(0, 50)));
};

export const markAllRead = () => {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem('fittrack_notifications', JSON.stringify(list));
};

export const getUnreadCount = (): number => getNotifications().filter(n => !n.read).length;
