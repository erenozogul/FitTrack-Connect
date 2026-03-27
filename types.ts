
export type UserRole = 'trainer' | 'student' | null;

export interface WorkoutTemplate {
  id: string;
  title: string;
  level: string; // Adjusted to string to allow more flexibility from the DB
  category?: string;
  duration: string;
  image: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'coach' | 'me';
  text?: string;
  type: 'text' | 'image' | 'file' | 'audio';
  timestamp: string;
  dataUrl?: string;
  fileName?: string;
  fileSize?: string;
}
