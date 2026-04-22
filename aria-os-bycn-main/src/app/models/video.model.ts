export interface SavedVideo {
  id: string;
  url: string;
  blob: Blob;
  date: Date;
  duration: number;
  title: string;
  scriptContent?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  mediaType?: 'video' | 'audio';
  userId?: string;
  pinned?: boolean;
}
