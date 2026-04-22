import { Timestamp } from 'firebase/firestore';

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type: 'update' | 'info' | 'alert';
  createdAt: Timestamp;
}
