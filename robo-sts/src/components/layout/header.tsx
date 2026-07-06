"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { Search, Bell, CalendarDays, User, Sun, Moon, Monitor, Settings, CheckCircle, AlertTriangle, AlertCircle, Info, Menu } from "lucide-react";
import { useNotificationsStore } from "@/store/notifications-store";
import { useProfileStore } from "@/store/profile-store";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/dashboard-store";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, setThemeState] = useState<"light" | "dark" | "system">("system");
  const { profile, loadProfile } = useProfileStore();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const displayName = user?.name || profile.name || "User";
  const displayRole = user?.role || profile.role || "Officer";
  const avatarFallback = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "CT";

  // Sync search input if query param changes
  useEffect(() => {
    setSearchQuery(searchParams?.get("q") || "");
    loadProfile();
  }, [searchParams, loadProfile]);

  // Use the notifications store
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);

  // Prioritize unread notifications at the top
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.read === b.read) {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      }
      return a.read ? 1 : -1;
    });
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    const subscribe = useNotificationsStore.getState().subscribeNotifications;
    const unsubscribe = useNotificationsStore.getState().unsubscribeNotifications;
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);

  const toggleTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Removed isLoggedOut overlay logic

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 px-4 md:px-6">
      {/* Mobile Hamburger Menu via Sheet */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0 border-0 bg-sidebar">
          <Sidebar />
        </SheetContent>
      </Sheet>
      {/* Global Search Input */}
      <form onSubmit={handleSearchSubmit} className="absolute left-1/2 -translate-x-1/2 w-full max-w-md lg:max-w-lg hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/80" />
          <Input
            type="text"
            placeholder="Search officers, meetings, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 transition-all text-sm font-medium"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 lg:gap-3 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-md shadow-red-500/30">
                    {unreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[500px] overflow-y-auto p-0">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Recent Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No new notifications</div>
              ) : (
                sortedNotifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      setSelectedNotification(notification);
                    }}
                    className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="font-medium text-xs text-slate-900 dark:text-white truncate">
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(notification.time)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white"
                onClick={() => router.push("/notifications")}
              >
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={() => router.push("/meetings?view=calendar")}>
          <CalendarDays className="w-5 h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon">
                <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleTheme("light")}>
              <Sun className="w-4 h-4 mr-2" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleTheme("dark")}>
              <Moon className="w-4 h-4 mr-2" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleTheme("system")}>
              <Monitor className="w-4 h-4 mr-2" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-slate-500">{displayRole}</p>
              </div>
            </div>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            {user?.role === "Super Admin" && (
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLogoutConfirmOpen(true)} className="text-red-600 dark:text-red-400">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Log out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of Civil Tracking?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setLogoutConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { setLogoutConfirmOpen(false); logout(); }}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => { if (!open) setSelectedNotification(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
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
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={<div className="h-16 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50" />}>
      <HeaderContent />
    </Suspense>
  );
}