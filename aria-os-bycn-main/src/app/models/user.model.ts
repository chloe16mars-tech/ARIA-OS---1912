import { Timestamp } from 'firebase/firestore';

export interface UserPreferences {
  intention?: string;
  tone?: string;
  stance?: string;
  duration?: string;
}

export interface UserProfile {
  generationCount: number;
  readNotifications?: string[];
  deletedNotifications?: string[];
  scheduledDeletionDate?: Timestamp | null;
  preferences?: UserPreferences;
}
