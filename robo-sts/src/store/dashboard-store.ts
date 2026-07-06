import { create } from "zustand";
import type { Notification, ThemeMode } from "@/types";

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: "system",
  setTheme: (theme) => set({ theme }),
  notifications: [
    {
      id: "1",
      title: "Meeting Scheduled",
      message: "New meeting with Shri Rajesh Kumar (IAS) scheduled for May 22, 11:00 AM",
      time: "2 minutes ago",
      read: false,
      type: "info",
    },
    {
      id: "2",
      title: "Update Completed",
      message: "Monthly compliance report has been updated successfully",
      time: "15 minutes ago",
      read: false,
      type: "success",
    },
    {
      id: "3",
      title: "Officer Transferred",
      message: "Smt. Priya Sharma (IPS) has been transferred to Delhi cadre",
      time: "1 hour ago",
      read: true,
      type: "warning",
    },
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
