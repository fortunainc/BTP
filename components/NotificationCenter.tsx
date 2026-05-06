"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ChevronRight,
  TrendingUp,
  Eye,
  Lightbulb,
  AlertTriangle,
  Briefcase,
  Settings,
  Loader2,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type NotificationClass = 'VALIDATION' | 'EXPANSION' | 'MOMENTUM' | 'PRESSURE' | 'OPPORTUNITY';
type NotificationPriority = 'P1' | 'P2' | 'P3';
type DisplayTime = 'just_now' | 'earlier' | 'today' | 'yesterday' | 'this_week' | 'a_while_back';

interface Notification {
  id: string;
  variantId: string;
  notificationClass: NotificationClass;
  priority: NotificationPriority;
  copy: string;
  contextSnippet?: string;
  relatedPostId?: string;
  relatedThreadId?: string;
  relatedOpportunityId?: string;
  relatedPatternId?: string;
  relatedMatchId?: string;
  read: boolean;
  dismissed: boolean;
  surfaces: string[];
  deliveredTo: string[];
  createdAt: string;
  displayTime: DisplayTime;
}

interface NotificationResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  unreadByClass: Record<NotificationClass, number>;
}

// ==========================================
// ICON MAPPING
// ==========================================

const CLASS_ICONS: Record<NotificationClass, React.ReactNode> = {
  VALIDATION: <Check className="w-4 h-4 text-emerald-400" />,
  EXPANSION: <Lightbulb className="w-4 h-4 text-blue-400" />,
  MOMENTUM: <TrendingUp className="w-4 h-4 text-purple-400" />,
  PRESSURE: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  OPPORTUNITY: <Briefcase className="w-4 h-4 text-cyan-400" />,
};

const CLASS_LABELS: Record<NotificationClass, string> = {
  VALIDATION: 'Validation',
  EXPANSION: 'Insights',
  MOMENTUM: 'Progress',
  PRESSURE: 'Attention',
  OPPORTUNITY: 'Opportunities',
};

const CLASS_COLORS: Record<NotificationClass, string> = {
  VALIDATION: 'border-emerald-500/30 bg-emerald-500/5',
  EXPANSION: 'border-blue-500/30 bg-blue-500/5',
  MOMENTUM: 'border-purple-500/30 bg-purple-500/5',
  PRESSURE: 'border-amber-500/30 bg-amber-500/5',
  OPPORTUNITY: 'border-cyan-500/30 bg-cyan-500/5',
};

const TIME_LABELS: Record<DisplayTime, string> = {
  just_now: 'Just now',
  earlier: 'Earlier',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  a_while_back: 'A while back',
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByClass, setUnreadByClass] = useState<Record<NotificationClass, number>>({
    VALIDATION: 0,
    EXPANSION: 0,
    MOMENTUM: 0,
    PRESSURE: 0,
    OPPORTUNITY: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeClass, setActiveClass] = useState<NotificationClass | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const classParam = activeClass ? `&class=${activeClass}` : '';
      const response = await fetch(`/api/notifications?unreadOnly=false&limit=50${classParam}`);
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setUnreadByClass(data.unreadByClass);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeClass]);

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed: true }),
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeClass ? { class: activeClass } : {}),
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Group notifications by time bucket
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const bucket = notification.displayTime;
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(notification);
    return acc;
  }, {} as Record<DisplayTime, Notification[]>);

  // Time bucket order
  const timeBucketOrder: DisplayTime[] = ['just_now', 'earlier', 'today', 'yesterday', 'this_week', 'a_while_back'];

  // Get link for notification
  const getNotificationLink = (notification: Notification): string => {
    if (notification.relatedOpportunityId) {
      return `/opportunities/${notification.relatedOpportunityId}`;
    }
    if (notification.relatedMatchId) {
      return `/matches/${notification.relatedMatchId}`;
    }
    if (notification.relatedPostId) {
      return `/contributions/${notification.relatedPostId}`;
    }
    if (notification.relatedPatternId) {
      return `/patterns/${notification.relatedPatternId}`;
    }
    return '#';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Unread Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-cyan-500 text-white text-xs font-medium flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[80vh] rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              <Link
                href="/notifications/settings"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-700 overflow-x-auto">
            <button
              onClick={() => setActiveClass(null)}
              className={`px-2 py-1 text-xs rounded-md whitespace-nowrap ${
                activeClass === null
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {(['VALIDATION', 'EXPANSION', 'MOMENTUM', 'PRESSURE', 'OPPORTUNITY'] as NotificationClass[]).map(
              (cls) => (
                <button
                  key={cls}
                  onClick={() => setActiveClass(activeClass === cls ? null : cls)}
                  className={`px-2 py-1 text-xs rounded-md whitespace-nowrap flex items-center gap-1 ${
                    activeClass === cls
                      ? 'bg-slate-700 text-slate-200'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {CLASS_LABELS[cls]}
                  {unreadByClass[cls] > 0 && (
                    <span className="bg-slate-600 text-slate-300 px-1 rounded text-[10px]">
                      {unreadByClass[cls]}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              timeBucketOrder.map((bucket) => {
                const bucketNotifications = groupedNotifications[bucket];
                if (!bucketNotifications || bucketNotifications.length === 0) return null;

                return (
                  <div key={bucket}>
                    <div className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-800/50">
                      {TIME_LABELS[bucket]}
                    </div>
                    {bucketNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative p-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${
                          !notification.read ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        )}

                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${
                              CLASS_COLORS[notification.notificationClass]
                            }`}
                          >
                            {CLASS_ICONS[notification.notificationClass]}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-snug">
                              {notification.copy}
                            </p>
                            {notification.contextSnippet && (
                              <p className="mt-1 text-xs text-slate-400 truncate">
                                {notification.contextSnippet}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                              <Link
                                href={getNotificationLink(notification)}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                View
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dismiss button */}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="flex-shrink-0 text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-700">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs text-slate-400 hover:text-slate-300 py-1"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}