import { Injectable, inject } from '@angular/core';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, getDoc, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);

  getNotificationsSnapshot(callback: (notifications: AppNotification[]) => void) {
    const user = this.authService.currentUser();
    if (!user) return () => { /* no-op */ };

    const q = query(collection(db, 'notifications'));
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppNotification));
      
      notifications.sort((a, b) => {
        const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return timeB - timeA;
      });
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });
  }

  async markNotificationAsRead(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const readNotifications = data['readNotifications'] || [];
        if (!readNotifications.includes(notificationId)) {
          await setDoc(userRef, { readNotifications: [...readNotifications, notificationId] }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  }

  async deleteNotification(notificationId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const deletedNotifications = data['deletedNotifications'] || [];
        if (!deletedNotifications.includes(notificationId)) {
          await setDoc(userRef, { deletedNotifications: [...deletedNotifications, notificationId] }, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  }
}
