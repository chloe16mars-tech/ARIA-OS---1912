import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

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

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private dbName = 'App1912DB';
  private storeName = 'videos';
  private db: IDBDatabase | null = null;
  private authService = inject(AuthService);
  private urlCache = new Set<string>();

  private revokeAllUrls() {
    this.urlCache.forEach(url => URL.revokeObjectURL(url));
    this.urlCache.clear();
  }

  private createUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urlCache.add(url);
    return url;
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveVideo(blob: Blob, duration: number, title = 'Vidéo sans titre', scriptContent?: string, mediaType: 'video' | 'audio' = 'video'): Promise<SavedVideo> {
    if (!this.db) await this.initDB();
    
    const user = this.authService.currentUser();
    
    const video: SavedVideo = {
      id: Date.now().toString(),
      url: URL.createObjectURL(blob),
      blob,
      date: new Date(),
      duration,
      title,
      scriptContent,
      isDeleted: false,
      mediaType,
      userId: user ? user.id : undefined,
      pinned: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(video);

      request.onsuccess = () => resolve(video);
      request.onerror = () => reject(request.error);
    });
  }

  async updateVideo(id: string, updates: Partial<SavedVideo>): Promise<SavedVideo> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const video = getRequest.result as SavedVideo;
        if (!video) {
          reject(new Error('Video not found'));
          return;
        }

        const user = this.authService.currentUser();
        const currentUserId = user ? user.id : undefined;
        if (video.userId && video.userId !== currentUserId) {
          reject(new Error('Unauthorized'));
          return;
        }

        const updatedVideo = { ...video, ...updates };
        
        // Don't save the URL object, it's transient
        if (updatedVideo.url) {
           updatedVideo.url = ''; 
        }

        const updateRequest = store.put(updatedVideo);
        updateRequest.onsuccess = () => {
           if (updatedVideo.blob) {
              updatedVideo.url = URL.createObjectURL(updatedVideo.blob);
           }
           resolve(updatedVideo);
        };
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getVideos(): Promise<SavedVideo[]> {
    if (!this.db) await this.initDB();
    this.revokeAllUrls(); // Clean up old URLs before creating new ones for the list

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const user = this.authService.currentUser();
        const currentUserId = user ? user.id : undefined;
        let allVideos = request.result as SavedVideo[];
        
        // Filter videos by user identity. Keep legacy (no userId) videos visible to avoid data loss initially.
        if (currentUserId) {
          allVideos = allVideos.filter(v => !v.userId || v.userId === currentUserId);
        } else {
          allVideos = allVideos.filter(v => !v.userId);
        }

        // Sort by date descending
        const videos = allVideos.sort((a, b) => b.date.getTime() - a.date.getTime());
        // Recreate object URLs since they don't persist across sessions
        videos.forEach(v => {
          if (v.blob) {
            v.url = this.createUrl(v.blob);
          }
        });
        resolve(videos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Placeholder for future cloud sync with Supabase Storage
   */
  async syncToCloud(videoId: string): Promise<string | null> {
     // TODO: Implement Supabase Storage upload
     // const { data, error } = await supabase.storage.from('videos').upload(...)
     return null;
  }

  async getVideo(id: string): Promise<SavedVideo | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const video = request.result as SavedVideo;
        if (video) {
          const user = this.authService.currentUser();
          const currentUserId = user ? user.id : undefined;
          
          if (video.userId && video.userId !== currentUserId) {
            resolve(null);
            return;
          }
          
          if (video.blob) {
            video.url = this.createUrl(video.blob);
          }
          resolve(video);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async moveToTrash(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const video = getRequest.result as SavedVideo;
        if (video) {
          const user = this.authService.currentUser();
          const currentUserId = user ? user.id : undefined;
          if (video.userId && video.userId !== currentUserId) {
            reject(new Error('Unauthorized'));
            return;
          }

          video.isDeleted = true;
          video.deletedAt = new Date();
          const updateRequest = store.put(video);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Video not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async restoreVideo(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const video = getRequest.result as SavedVideo;
        if (video) {
          const user = this.authService.currentUser();
          const currentUserId = user ? user.id : undefined;
          if (video.userId && video.userId !== currentUserId) {
            reject(new Error('Unauthorized'));
            return;
          }

          video.isDeleted = false;
          video.deletedAt = undefined;
          const updateRequest = store.put(video);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Video not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async permanentlyDeleteVideo(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const video = getRequest.result as SavedVideo;
        if (video) {
          const user = this.authService.currentUser();
          const currentUserId = user ? user.id : undefined;
          if (video.userId && video.userId !== currentUserId) {
            reject(new Error('Unauthorized'));
            return;
          }
          
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } else {
          resolve(); 
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async emptyTrash(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const user = this.authService.currentUser();
        const currentUserId = user ? user.id : undefined;
        let videos = request.result as SavedVideo[];
        
        if (currentUserId) {
          videos = videos.filter(v => !v.userId || v.userId === currentUserId);
        } else {
          videos = videos.filter(v => !v.userId);
        }

        const deletePromises = videos
          .filter(v => v.isDeleted)
          .map(v => {
            return new Promise<void>((res, rej) => {
              const delReq = store.delete(v.id);
              delReq.onsuccess = () => res();
              delReq.onerror = () => rej(delReq.error);
            });
          });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(err => reject(err));
      };
      request.onerror = () => reject(request.error);
    });
  }
}
