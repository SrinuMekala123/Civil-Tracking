"use client";

import { useState, useEffect, useMemo } from "react";
import { useNotificationsStore } from "@/store/notifications-store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  RefreshCcw,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Search,
} from "lucide-react";
import type { Notification } from "@/types";

const formatRelativeTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Just now";
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return "Just now";
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Recently";
  }
};

export default function NotificationsPage() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const error = useNotificationsStore((s) => s.error);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const clearAll = useNotificationsStore((s) => s.clearAll);
  const deleteNotification = useNotificationsStore((s) => s.deleteNotification);

  const [searchInput, setSearchInput] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    let data = notifications;
    const q = searchInput.toLowerCase();
    if (q) {
      data = data.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      data = data.filter((n) => n.type === typeFilter);
    }
    if (readFilter === "unread") {
      data = data.filter((n) => !n.read);
    } else if (readFilter === "read") {
      data = data.filter((n) => n.read);
    }
    return data;
  }, [notifications, searchInput, typeFilter, readFilter]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setTypeFilter("all");
    setReadFilter("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" /> Mark All Read
            </Button>
            <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear All
            </Button>
          </div>
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={readFilter} onValueChange={(value) => setReadFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Read Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" onClick={() => fetchNotifications()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No notifications found.</div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`glass-card border-0 transition-all ${!notification.read
                  ? "border-l-4 border-l-indigo-500"
                  : "opacity-75"
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id);
                        setSelectedNotification(notification);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">{formatRelativeTime(notification.time)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => { if (!open) setSelectedNotification(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedNotification && getIcon(selectedNotification.type)}
              <DialogTitle className="text-base font-semibold">
                {selectedNotification?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Received on {selectedNotification?.time ? new Date(selectedNotification.time).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 break-words whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {selectedNotification?.message}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNotification(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}