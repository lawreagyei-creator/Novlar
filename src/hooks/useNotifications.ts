import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

// Supabase channel removal is asynchronous. A unique topic prevents a quick
// remount from reusing a channel that is still subscribed during cleanup.
let notificationChannelSequence = 0;

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchNotifications = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;
        if (active) {
          const rows = (data ?? []) as Notification[];
          setNotifications(rows);
          setUnreadCount(rows.filter((n) => !n.is_read).length);
        }
      } catch (err) {
        console.error('NOVLAR notifications fetch failed:', err);
        if (active) {
          setError('We could not load your notifications. Please check your connection and try again.');
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotifications();

    const channelTopic = `notifications-${userId}-${++notificationChannelSequence}`;
    const channel = supabase
      .channel(channelTopic)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new as Notification;
        setNotifications((prev) => {
          const existing = prev.find((n) => n.id === updated.id);
          if (existing && !existing.is_read && updated.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.map((n) => (n.id === updated.id ? updated : n));
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    const { error: updateError } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (updateError) {
      console.error('NOVLAR mark notification read failed:', updateError);
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const { error: updateError } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (updateError) {
      console.error('NOVLAR mark all notifications read failed:', updateError);
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead };
}
