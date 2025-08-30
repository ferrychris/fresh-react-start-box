import { supabase } from './client';
import { Notification } from './types';

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) {
    console.warn('getNotifications called with no userId');
    return [];
  }

  // Retry logic
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Add timeout to the fetch operation
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Notification fetch timeout')), 5000);
      });
      
      // Actual fetch operation
      const fetchPromise = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Race between timeout and fetch
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Check for network errors that should trigger retry
        if ((error.message?.includes('Failed to fetch') || 
             error.message?.includes('connection closed') || 
             error.message?.includes('network') ||
             error.code === 'PGRST499') && 
            retries < maxRetries - 1) {
          console.warn(`Retry ${retries + 1}/${maxRetries} for notifications`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data as Notification[];
    } catch (error: any) {
      if (retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} for notifications after exception: ${error.message || 'Unknown error'}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      console.error('Error in getNotifications:', error);
      return [];
    }
  }
  
  console.warn('Maximum retries reached for notifications fetch');
  return [];
};

export const markNotificationAsRead = async (notificationId: string) => {
  if (!notificationId) {
    console.warn('markNotificationAsRead called with no notificationId');
    throw new Error('Notification ID is required');
  }

  // Retry logic
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Add timeout to the operation
      const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Mark notification as read timeout')), 5000);
      });
      
      // Actual operation
      const updatePromise = supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      // Race between timeout and update
      const { error } = await Promise.race([
        updatePromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Check for network errors that should trigger retry
        if ((error.message?.includes('Failed to fetch') || 
             error.message?.includes('connection closed') || 
             error.message?.includes('network') ||
             error.code === 'PGRST499') && 
            retries < maxRetries - 1) {
          console.warn(`Retry ${retries + 1}/${maxRetries} for marking notification as read`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      return; // Success
    } catch (error: any) {
      if (retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} for marking notification as read after exception: ${error.message || 'Unknown error'}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      console.error('Error in markNotificationAsRead:', error);
      throw error;
    }
  }
  
  throw new Error('Maximum retries reached for marking notification as read');
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
  if (!notification || !notification.user_id) {
    console.warn('createNotification called with invalid notification data');
    throw new Error('Valid notification data is required');
  }

  // Retry logic
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Add timeout to the operation
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Create notification timeout')), 5000);
      });
      
      // Actual operation
      const insertPromise = supabase
        .from('notifications')
        .insert([notification])
        .select()
        .maybeSingle();
      
      // Race between timeout and insert
      const { data, error } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Check for network errors that should trigger retry
        if ((error.message?.includes('Failed to fetch') || 
             error.message?.includes('connection closed') || 
             error.message?.includes('network') ||
             error.code === 'PGRST499') && 
            retries < maxRetries - 1) {
          console.warn(`Retry ${retries + 1}/${maxRetries} for creating notification`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      if (retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} for creating notification after exception: ${error.message || 'Unknown error'}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      console.error('Error in createNotification:', error);
      throw error;
    }
  }
  
  throw new Error('Maximum retries reached for creating notification');
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('getUnreadNotificationCount called with no userId');
    return 0;
  }

  // Retry logic
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Add timeout to the operation
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Get unread notification count timeout')), 5000);
      });
      
      // Actual operation
      const countPromise = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      // Race between timeout and count
      const { count, error } = await Promise.race([
        countPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Check for network errors that should trigger retry
        if ((error.message?.includes('Failed to fetch') || 
             error.message?.includes('connection closed') || 
             error.message?.includes('network') ||
             error.code === 'PGRST499') && 
            retries < maxRetries - 1) {
          console.warn(`Retry ${retries + 1}/${maxRetries} for getting unread notification count`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries))); // Exponential backoff
          continue;
        }
        
        console.error('Error getting unread notification count:', error);
        return 0; // Return 0 on error to avoid breaking UI
      }

      return count || 0;
    } catch (error: any) {
      if (retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} for getting unread notification count after exception: ${error.message || 'Unknown error'}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        continue;
      }
      console.error('Error in getUnreadNotificationCount:', error);
      return 0; // Return 0 on error to avoid breaking UI
    }
  }
  
  console.warn('Maximum retries reached for getting unread notification count');
  return 0; // Return 0 after max retries to avoid breaking UI
};
