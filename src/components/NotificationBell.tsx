
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Clock, DollarSign, Users, Trophy } from 'lucide-react';
import { 
  getNotificationsForUser, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  type Notification
} from '../lib/supabase';
import { useApp } from '../App';

export const NotificationBell: React.FC = () => {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - notifications disabled');
      setNotifications([]);
      return;
    }
    
    try {
      const data = await getNotificationsForUser(user.id);
      setNotifications(data);
    } catch (error) {
      // Handle database connection errors gracefully
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('schema cache') ||
        error.message.includes('503')
      )) {
        console.warn('⚠️ Database temporarily unavailable - notifications disabled');
        setNotifications([]);
      } else {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - unread count disabled');
      setUnreadCount(0);
      return;
    }
    
    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error loading unread count - database may be unavailable');
        setUnreadCount(0);
      } else {
        console.error('Error loading unread count:', error);
        setUnreadCount(0);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - mark as read disabled');
      return;
    }
    
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error marking notification as read - database may be unavailable');
      } else {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase not configured - mark all as read disabled');
      return;
    }
    
    setLoading(true);
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error marking all as read - database may be unavailable');
      } else {
        console.error('Error marking all as read:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sponsorship_inquiry':
        return <DollarSign className="h-4 w-4 text-green-400" />;
      case 'new_superfan':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'new_fan':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'tip_received':
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 rounded-xl transition-all duration-200 group text-gray-400 hover:text-white hover:bg-gray-800/80 hover:shadow-lg"
      >
        <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xs text-white font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={loading}
                      className="text-xs text-fedex-orange hover:text-fedex-orange-light transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Marking...' : 'Mark all read'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-800 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-gray-800/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                        setShowDropdown(false);
                        
                        // Navigate based on notification type
                        if (notification.type === 'sponsorship_inquiry') {
                          window.location.href = '/dashboard?tab=sponsorship';
                        } else if (notification.type === 'new_superfan' || notification.type === 'new_fan') {
                          window.location.href = '/dashboard?tab=fans';
                        } else if (notification.type === 'tip_received') {
                          window.location.href = '/dashboard?tab=earnings';
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.read ? 'text-white' : 'text-gray-300'
                            }`}>
                              {(notification as any).title || 'Notification'}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-fedex-orange rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.read ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            {(notification as any).message || 'You have a new notification'}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.type === 'sponsorship_inquiry' && (notification as any).data?.spot_price && (
                              <span className="text-xs text-green-400 font-medium">
                                💰 ${(((notification as any).data.spot_price as number) / 100)}/race
                              </span>
                            )}
                            {notification.type === 'new_superfan' && (notification as any).data?.subscription_amount && (
                              <span className="text-xs text-purple-400 font-medium">
                                💎 ${(((notification as any).data.subscription_amount as number) / 100)}/mo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    window.location.href = '/dashboard?tab=notifications';
                  }}
                  className="w-full text-center text-sm text-fedex-orange hover:text-fedex-orange-light transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
