
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/data';
import { Skeleton } from './ui/skeleton';

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 transition-colors hover:bg-accent/50",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex-1">
        <Link href={notification.href || '#'} className="block" onClick={() => onRead(notification.id)}>
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-xs text-muted-foreground">{notification.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
          </p>
        </Link>
      </div>
       {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => onRead(notification.id)}
          aria-label="Mark as read"
        >
          <CheckCheck className="h-4 w-4" />
        </Button>
       )}
    </div>
  );
}


export function Notifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Toggle notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-96">
          {isLoading && (
             <div className="p-3 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!isLoading && (!notifications || notifications.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mb-3" />
              <p className="text-sm">You have no new notifications.</p>
            </div>
          ) : (
             <div className="divide-y">
                {notifications?.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                    />
                ))}
             </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
