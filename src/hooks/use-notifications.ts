
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  doc,
  writeBatch,
  serverTimestamp,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Notification } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy('date', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.read).length || 0;
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    if (!firestore || !user) return;
    const notificationRef = doc(firestore, `users/${user.uid}/notifications`, notificationId);
    updateDoc(notificationRef, { read: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: notificationRef.path,
            operation: 'update',
            requestResourceData: { read: true }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const markAllAsRead = () => {
    if (!firestore || !user || !notifications) return;
    
    const batch = writeBatch(firestore);
    notifications.forEach(notification => {
      if (!notification.read) {
        const docRef = doc(firestore, `users/${user.uid}/notifications`, notification.id);
        batch.update(docRef, { read: true });
      }
    });

    batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/notifications`,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    if (!firestore || !user) return;

    const notificationsRef = collection(firestore, `users/${user.uid}/notifications`);
    const newNotification = {
      ...notification,
      date: new Date().toISOString(),
      read: false
    };

    addDoc(notificationsRef, newNotification).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: notificationsRef.path,
        operation: 'create',
        requestResourceData: newNotification,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addNotification, // Exposed for adding new notifications
  };
}

    