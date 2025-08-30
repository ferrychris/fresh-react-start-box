import { supabase } from './client';
import { Notification } from './types';

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data as Notification[];
};

// New helpers to match component imports
export const getUserNotifications = async (userId: string, limit = 20): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) {
        console.error('Error fetching user notifications:', error);
        return [];
    }
    return data as Notification[];
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    if (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
    return true;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
    return true;
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) {
        console.error('Error counting unread notifications:', error);
        return 0;
    }
    return count ?? 0;
};

export const createNotification = async (notification: Partial<Notification>): Promise<Notification | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createNotification:', error);
    return null;
  }
};

// Alias for backward compatibility
export const getNotificationsForUser = getUserNotifications;
