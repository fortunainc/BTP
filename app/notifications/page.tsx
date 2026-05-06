"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Eye,
  Lightbulb,
  AlertTriangle,
  Briefcase,
  Settings,
  Loader2,
  Filter,
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
  VALIDATION: <Check className="w-5 h-5 text-emerald-400" />,
  EXPANSION: <Lightbulb className="w-5 h-5 text-blue-400" />,
  MOMENTUM: <TrendingUp className="w-5 h-5 text-purple-400" />,
  PRESSURE: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  OPPORTUNITY: <Briefcase className="w-5 h-5 text-cyan-400" />,
};

const CLASS_LABELS: Record<NotificationClass, string> = {
  VALIDATION: 'Validation',
  EXPANSION: 'Insights',
  MOMENTUM: 'Progress',
  PRESSURE: 'Attention',
  OPPORTUNITY: 'Opportunities',
};

const CLASS_DESCRIPTIONS: Record<NotificationClass, string> = {
  VALIDATION: 'Recognition and confirmation from the community',
  EXPANSION: 'New insights and developments on your contributions',
  MOMENTUM: 'Your progress and status changes',
  PRESSURE: 'Time-sensitive items requiring your attention',
  OPPORTUNITY: 'New opportunities matching your profile',
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
  earlier: 'Earlier today',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'Earlier this week',
  a_while_back: 'A while back',
};

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByClass, setUnreadByClass] = useState<Record<NotificationClass, number>>({
    VALIDATION: 0,
    EXPANSION: 0,
    MOMENTUM: 0,
    PRESSURE: 0,
    OPPORTUNITY: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClass, setActiveClass] = useState<NotificationClass | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        unreadOnly: showUnreadOnly.toString(),
      });
      if (activeClass) {
        params.append('class', activeClass);
      }
      
      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setTotalCount(data.totalCount);
      setUnreadCount(data.unreadCount);
      setUnreadByClass(data.unreadByClass);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeClass, showUnreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      setTotalCount(prev => prev - 1);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
              <h1 className="text-xl font-semibold text-slate-100">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Link href="/notifications/settings">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Class Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveClass(null)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                activeClass === null
                  ? 'bg-slate-700 border-slate-600 text-slate-200'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {(['VALIDATION', 'EXPANSION', 'MOMENTUM', 'PRESSURE', 'OPPORTUNITY'] as NotificationClass[]).map(
              (cls) => (
                <button
                  key={cls}
                  onClick={() => setActiveClass(activeClass === cls ? null : cls)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                    activeClass === cls
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {CLASS_LABELS[cls]}
                  {unreadByClass[cls] > 0 && (
                    <span className="bg-slate-600 text-slate-300 px-1.5 rounded text-xs">
                      {unreadByClass[cls]}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          {/* Unread Only Toggle */}
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            Show unread only
          </label>
        </div>

        {/* Class Summary Cards (when no filter active) */}
        {!activeClass && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {(['VALIDATION', 'EXPANSION', 'MOMENTUM', 'PRESSURE', 'OPPORTUNITY'] as NotificationClass[]).map(
              (cls) => (
                <button
                  key={cls}
                  onClick={() => setActiveClass(cls)}
                  className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${CLASS_COLORS[cls]}`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {CLASS_ICONS[cls]}
                  </div>
                  <p className="text-xs text-slate-300 text-center">{CLASS_LABELS[cls]}</p>
                  <p className="text-lg font-semibold text-slate-100 text-center mt-1">
                    {unreadByClass[cls]}
                  </p>
                </button>
              )
            )}
          </div>
        )}

        {/* Active Filter Description */}
        {activeClass && (
          <div className={`p-4 rounded-lg border mb-6 ${CLASS_COLORS[activeClass]}`}>
            <div className="flex items-center gap-3">
              {CLASS_ICONS[activeClass]}
              <div>
                <p className="font-medium text-slate-200">{CLASS_LABELS[activeClass]}</p>
                <p className="text-sm text-slate-400">{CLASS_DESCRIPTIONS[activeClass]}</p>
              </div>
              <button
                onClick={() => setActiveClass(null)}
                className="ml-auto text-slate-400 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg">No notifications</p>
            <p className="text-sm mt-1">
              {showUnreadOnly
                ? "You've read all your notifications"
                : "Check back later for updates"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {timeBucketOrder.map((bucket) => {
              const bucketNotifications = groupedNotifications[bucket];
              if (!bucketNotifications || bucketNotifications.length === 0) return null;

              return (
                <div key={bucket}>
                  <h2 className="text-sm font-medium text-slate-500 mb-3">
                    {TIME_LABELS[bucket]}
                  </h2>
                  <div className="space-y-2">
                    {bucketNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors ${
                          !notification.read ? 'bg-slate-800/50' : 'bg-slate-900/30'
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400" />
                        )}

                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${
                              CLASS_COLORS[notification.notificationClass]
                            }`}
                          >
                            {CLASS_ICONS[notification.notificationClass]}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 leading-relaxed">
                              {notification.copy}
                            </p>
                            {notification.contextSnippet && (
                              <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                                {notification.contextSnippet}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-3">
                              <Link
                                href={getNotificationLink(notification)}
                                onClick={() => markAsRead(notification.id)}
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                View details
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-sm text-slate-400 hover:text-slate-300"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dismiss button */}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="flex-shrink-0 text-slate-500 hover:text-slate-300 p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination/Load More */}
        {notifications.length > 0 && totalCount > notifications.length && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {/* Load more logic */}}
              className="border-slate-700 text-slate-300 hover:text-slate-100"
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}