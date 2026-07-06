"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Shield, Calendar, GitCommit, FileText, Settings, UserCog, Activity, ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/store/notifications-store";
import { useAppStore } from "@/store/dashboard-store";
import { useProfileStore } from "@/store/profile-store";
import { useAuthStore } from "@/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ias-database", label: "IAS Database", icon: Users },
  { href: "/ips-database", label: "IPS Database", icon: Shield },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/users", label: "User Management", icon: UserCog },
  { href: "/updates", label: "Updates Log", icon: GitCommit },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const { profile, loadProfile } = useProfileStore();
  const { user, logout } = useAuthStore();

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const displayName = user?.name || profile.name || "User";
  const displayRole = user?.role || profile.role || "Officer";

  useEffect(() => {
    fetchNotifications();
    loadProfile();
  }, [fetchNotifications, loadProfile]);

  return (
    <aside className="flex flex-col bg-sidebar border-r border-sidebar-border h-full w-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border relative">
        <div className={cn("flex items-center gap-3", !sidebarOpen && "md:justify-center md:w-full")}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          {(sidebarOpen || typeof window !== "undefined" && window.innerWidth < 768) && (
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Civil Tracking</h1>
              <p className="text-sidebar-foreground/60 text-xs">Smart Tracking System</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200 hidden md:block",
            sidebarOpen
              ? "p-1.5 rounded-lg"
              : "absolute -right-3 top-1/2 -translate-y-1/2 p-1 bg-sidebar border border-sidebar-border rounded-full shadow-md z-50 hover:scale-110"
          )}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white transition-all duration-200 group relative overflow-hidden",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-indigo-500/10 font-semibold",
                !sidebarOpen && "md:justify-center"
              )}
            >
              {/* Active neon left indicator */}
              {isActive && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />
              )}
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
              {(sidebarOpen || (typeof window !== "undefined" && window.innerWidth < 768)) && (
                <span className="text-sm">{item.label}</span>
              )}
              {!sidebarOpen && typeof window !== "undefined" && window.innerWidth >= 768 && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-all duration-200 cursor-pointer text-left focus:outline-hidden",
                !sidebarOpen && "md:justify-center"
              )}>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <UserCog className="w-4 h-4 text-white" />
                </div>
                {(sidebarOpen || typeof window !== "undefined" && window.innerWidth < 768) && (
                  <div>
                    <p className="text-white text-sm font-medium leading-none mb-1">{displayName}</p>
                    <p className="text-sidebar-foreground/60 text-xs">{displayRole}</p>
                  </div>
                )}
              </button>
            }
          />
          <DropdownMenuContent 
            align={sidebarOpen || typeof window !== "undefined" && window.innerWidth < 768 ? "start" : "end"} 
            side={sidebarOpen || typeof window !== "undefined" && window.innerWidth < 768 ? "top" : "right"} 
            className="w-56"
          >
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

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "w-full items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white transition-all duration-200 cursor-pointer hidden md:flex",
            !sidebarOpen && "justify-center"
          )}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-sm">Collapse</span>}
        </button>

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
              <Button variant="destructive" onClick={() => { setLogoutConfirmOpen(false); logout(); router.push("/login"); }}>
                Log out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
