"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { Notification } from "@/types";

export interface Toast {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "error";
}

interface NotificationsState {
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
    unreadCount: number;
    toasts: Toast[];

    fetchNotifications: (filters?: { type?: string; read?: boolean }) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    subscribeNotifications: () => Promise<void>;
    unsubscribeNotifications: () => Promise<void>;
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    isLoading: false,
    error: null,
    unreadCount: 0,
    toasts: [],

    fetchNotifications: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const parts: string[] = [];
            if (filters?.type && filters.type !== "all") {
                parts.push(`type = "${filters.type}"`);
            }
            if (filters?.read !== undefined) {
                parts.push(`read = ${filters.read}`);
            }
            const filter = parts.length ? parts.join(" && ") : undefined;

            const result = await pb.collection("notifications").getFullList({
                sort: "-created",
                filter,
            });

            const mappedNotifications: Notification[] = result.map((record) => ({
                id: record.id,
                title: record.title || "",
                message: record.message || "",
                time: record.time || record.created,
                read: record.read || false,
                type: record.type as "info" | "warning" | "success" | "error" || "info",
            }));

            const unreadCount = mappedNotifications.filter((n) => !n.read).length;

            set({
                notifications: mappedNotifications,
                unreadCount,
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load notifications";
            console.error("Failed to fetch notifications:", error);
            set({ error: message, isLoading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            await pb.collection("notifications").update(id, { read: true });
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    },

    markAllAsRead: async () => {
        try {
            const unread = get().notifications.filter((n) => !n.read);
            for (const n of unread) {
                await pb.collection("notifications").update(n.id, { read: true });
            }
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    },

    clearAll: async () => {
        try {
            for (const n of get().notifications) {
                await pb.collection("notifications").delete(n.id);
            }
            set({ notifications: [], unreadCount: 0 });
        } catch (error) {
            console.error("Failed to clear notifications:", error);
        }
    },

    deleteNotification: async (id) => {
        try {
            await pb.collection("notifications").delete(id);
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    subscribeNotifications: async () => {
        try {
            await pb.collection("notifications").unsubscribe("*");
            await pb.collection("notifications").subscribe("*", (e) => {
                const mapRecord = (record: any): Notification => ({
                    id: record.id,
                    title: record.title || "",
                    message: record.message || "",
                    time: record.time || record.created,
                    read: record.read || false,
                    type: record.type as "info" | "warning" | "success" | "error" || "info",
                });

                if (e.action === "create") {
                    const newNotif = mapRecord(e.record);
                    const toastId = Math.random().toString();
                    const newToast = {
                        id: toastId,
                        title: newNotif.title,
                        message: newNotif.message,
                        type: newNotif.type,
                    };
                    
                    set((state) => {
                        if (state.notifications.some((n) => n.id === newNotif.id)) return {};
                        const updated = [newNotif, ...state.notifications];
                        return {
                            notifications: updated,
                            unreadCount: updated.filter((n) => !n.read).length,
                            toasts: [...state.toasts, newToast],
                        };
                    });

                    setTimeout(() => {
                        get().removeToast(toastId);
                    }, 5000);
                } else if (e.action === "update") {
                    const updatedNotif = mapRecord(e.record);
                    set((state) => {
                        const updated = state.notifications.map((n) =>
                            n.id === updatedNotif.id ? updatedNotif : n
                        );
                        return {
                            notifications: updated,
                            unreadCount: updated.filter((n) => !n.read).length,
                        };
                    });
                } else if (e.action === "delete") {
                    const deletedId = e.record.id;
                    set((state) => {
                        const updated = state.notifications.filter((n) => n.id !== deletedId);
                        return {
                            notifications: updated,
                            unreadCount: updated.filter((n) => !n.read).length,
                        };
                    });
                }
            });
        } catch (error) {
            console.error("Failed to subscribe to notifications:", error);
        }
    },

    unsubscribeNotifications: async () => {
        try {
            await pb.collection("notifications").unsubscribe("*");
        } catch (error) {
            console.error("Failed to unsubscribe from notifications:", error);
        }
    },

    addToast: (toastData) => {
        const id = Math.random().toString();
        const newToast = { id, ...toastData };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        setTimeout(() => {
            get().removeToast(id);
        }, 5000);
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));