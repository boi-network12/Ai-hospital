// src/contexts/NotificationContext.tsx
import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationsResponse,
  PushNotificationPayload,
} from '@/types/notification';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';
import { apiFetch } from '@/Utils/api';

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  refreshing: boolean;
  
  // Fetch methods
  fetchNotifications: (filters?: NotificationFilters, refresh?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Mutation methods
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Real-time methods
  handlePushNotification: (payload: PushNotificationPayload) => void;
  setupRealTimeListeners: () => void;
  cleanupRealTimeListeners: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);


interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { auth } = useAuth();
  const { showAlert } = useToast();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Derived state
  const unreadCount = stats?.unread || 0;

  // Fetch notifications with filters
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}, refresh = false) => {
    if (!auth.isAuth) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const queryString = queryParams.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiFetch<NotificationsResponse>(endpoint);
      setNotifications(response.notifications);

    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      showAlert({ 
        message: error.message || 'Failed to load notifications', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auth.isAuth, showAlert]);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    if (!auth.isAuth) return;

    try {
      const response = await apiFetch<NotificationStats>('/notifications/stats');
      setStats(response);
    } catch (error: any) {
      console.error('Failed to fetch notification stats:', error);
      // Don't show alert for stats failure as it's less critical
    }
  }, [auth.isAuth]);

  // Refresh notifications (pull to refresh)
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications({}, true);
    await fetchStats();
  }, [fetchNotifications, fetchStats]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!auth.isAuth) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId 
          ? { ...notif, status: 'read' }
          : notif
      ));

      // Update stats optimistically
      setStats(prev => prev ? {
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      } : null);

      await apiFetch<Notification>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      // Refetch stats to ensure consistency
      await fetchStats();

    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      
      // Revert optimistic update
      await fetchNotifications();
      await fetchStats();
      
      showAlert({ 
        message: error.message || 'Failed to mark as read', 
        type: 'error' 
      });
    }
  }, [auth.isAuth, fetchNotifications, fetchStats, showAlert]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!auth.isAuth) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(notif => 
        notif.status === 'unread' 
          ? { ...notif, status: 'read' }
          : notif
      ));

      // Update stats optimistically
      setStats(prev => prev ? {
        ...prev,
        unread: 0,
        read: prev.read + prev.unread,
      } : null);

      const response = await apiFetch<{ message: string; modifiedCount: number }>(
        '/notifications/read-all',
        { method: 'PATCH' }
      );

      showAlert({ 
        message: response.message || 'All notifications marked as read', 
        type: 'success' 
      });

    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      
      // Revert optimistic update
      await fetchNotifications();
      await fetchStats();
      
      showAlert({ 
        message: error.message || 'Failed to mark all as read', 
        type: 'error' 
      });
    }
  }, [auth.isAuth, fetchNotifications, fetchStats, showAlert]);

  // Dismiss a notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    if (!auth.isAuth) return;

    try {
        // Find the notification being dismissed
        const notificationToDismiss = notifications.find(n => n.id === notificationId);
        if (!notificationToDismiss) return;

        // Optimistic update: update status in list
        setNotifications(prev => prev.map(notif =>
        notif.id === notificationId 
            ? { ...notif, status: 'dismissed' as const }
            : notif
        ));

        // Optimistic stats update
        setStats(prev => prev ? {
        ...prev,
        unread: notificationToDismiss.status === 'unread' ? Math.max(0, prev.unread - 1) : prev.unread,
        dismissed: prev.dismissed + 1,
        } : null);

        await apiFetch<Notification>(`/notifications/${notificationId}/dismiss`, {
        method: 'PATCH',
        });

        await fetchStats();

    } catch (error: any) {
        console.error('Failed to dismiss notification:', error);
        
        // Revert on error
        await fetchNotifications();
        await fetchStats();
        
        showAlert({ 
        message: error.message || 'Failed to dismiss notification', 
        type: 'error' 
        });
    }
    }, [auth.isAuth, notifications, fetchNotifications, fetchStats, showAlert]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!auth.isAuth) return;

    try {
      // Optimistic update
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Update stats optimistically
      if (notificationToDelete && stats) {
        setStats({
          ...stats,
          total: stats.total - 1,
          unread: notificationToDelete.status === 'unread' ? Math.max(0, stats.unread - 1) : stats.unread,
          read: notificationToDelete.status === 'read' ? Math.max(0, stats.read - 1) : stats.read,
          dismissed: notificationToDelete.status === 'dismissed' ? Math.max(0, stats.dismissed - 1) : stats.dismissed,
          byType: {
            ...stats.byType,
            [notificationToDelete.type]: Math.max(0, stats.byType[notificationToDelete.type] - 1),
          },
        });
      }

      await apiFetch<{ message: string }>(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      showAlert({ 
        message: 'Notification deleted', 
        type: 'success' 
      });

    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      
      // Revert optimistic update
      await fetchNotifications();
      await fetchStats();
      
      showAlert({ 
        message: error.message || 'Failed to delete notification', 
        type: 'error' 
      });
    }
  }, [auth.isAuth, notifications, stats, fetchNotifications, fetchStats, showAlert]);

  // Handle push notification from FCM/APNS
  const handlePushNotification = useCallback((payload: PushNotificationPayload) => {
    // Convert push notification to app notification
    const newNotification: Notification = {
      id: payload.data?.notificationId || `push-${Date.now()}`,
      user: 'current', // This will be replaced when fetched from server
      type: payload.data?.type || 'system',
      title: payload.title,
      message: payload.body,
      data: payload.data,
      status: 'unread',
      priority: 'medium',
      actionUrl: payload.data?.actionUrl,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to local state optimistically
    setNotifications(prev => [newNotification, ...prev]);
    
    // Update stats optimistically
    setStats(prev => prev ? {
      ...prev,
      total: prev.total + 1,
      unread: prev.unread + 1,
      byType: {
        ...prev.byType,
        [newNotification.type]: (prev.byType[newNotification.type] || 0) + 1,
      },
    } : null);

    // Refresh from server to get the actual notification
    setTimeout(() => {
      fetchNotifications();
      fetchStats();
    }, 1000);
  }, [fetchNotifications, fetchStats]);

  // Setup real-time listeners (WebSocket)
  const setupRealTimeListeners = useCallback(() => {
    // This would integrate with your WebSocket setup
    // For now, we'll set up a polling mechanism as a fallback
    console.log('Setting up real-time notification listeners');
    
    // Poll for new notifications every 30 seconds when app is active
    const pollInterval = setInterval(() => {
      if (auth.isAuth) {
        fetchStats(); // Lightweight stats check
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [auth.isAuth, fetchStats]);

  const cleanupRealTimeListeners = useCallback(() => {
    console.log('Cleaning up real-time notification listeners');
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (auth.isAuth) {
      fetchNotifications();
      fetchStats();
      const cleanup = setupRealTimeListeners();
      return cleanup;
    } else {
      // Clear notifications when logged out
      setNotifications([]);
      setStats(null);
    }
  }, [auth.isAuth, fetchNotifications, fetchStats, setupRealTimeListeners]);

  // Auto-refresh when app comes to foreground
  useEffect(() => {
    // const handleAppStateChange = (nextAppState: string) => {
    //   if (nextAppState === 'active' && auth.isAuth) {
    //     refreshNotifications();
    //   }
    // };

    // You would typically use AppState from react-native here
    // For now, this is a placeholder
    console.log('App state change listener setup');

    return () => {
      // Cleanup app state listener
    };
  }, [auth.isAuth, refreshNotifications]);

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    stats,
    loading,
    refreshing,
    
    // Fetch methods
    fetchNotifications,
    fetchStats,
    refreshNotifications,
    
    // Mutation methods
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    
    // Real-time methods
    handlePushNotification,
    setupRealTimeListeners,
    cleanupRealTimeListeners,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};