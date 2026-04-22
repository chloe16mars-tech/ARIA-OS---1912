import { Timestamp } from 'firebase/firestore';

export interface ScriptData {
  id?: string;
  userId: string;
  sourceUrl?: string;
  sourceText?: string;
  sourceType: 'video' | 'article' | 'social' | 'text';
  intention: string;
  tone: string;
  stance?: string;
  duration: string;
  content: string;
  reflectionTime?: number;
  createdAt: Timestamp;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  title?: string;
  pinned?: boolean;
}
