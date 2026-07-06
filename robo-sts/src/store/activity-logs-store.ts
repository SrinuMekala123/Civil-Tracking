"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { ActivityLog } from "@/types";

interface ActivityLogsState {
    logs: ActivityLog[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;

    fetchLogs: (filters?: {
        action?: string;
        resourceType?: string;
        search?: string;
    }) => Promise<void>;
    addLog: (log: Partial<ActivityLog>) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useActivityLogsStore = create<ActivityLogsState>((set, get) => ({
    logs: [],
    isLoading: false,
    error: null,
    totalCount: 0,

    fetchLogs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const parts: string[] = [];
            if (filters?.action && filters.action !== "all") {
                parts.push(`action = "${filters.action}"`);
            }
            if (filters?.resourceType && filters.resourceType !== "all") {
                parts.push(`resource_type = "${filters.resourceType}"`);
            }
            if (filters?.search) {
                const q = filters.search;
                parts.push(`(user_name~"${q}" || details~"${q}" || resource_type~"${q}")`);
            }
            const filter = parts.length ? parts.join(" && ") : undefined;

            const result = await pb.collection("activity_logs").getFullList({
                sort: "-timestamp",
                filter,
            });

            const mappedLogs: ActivityLog[] = result.map((record) => ({
                id: record.id,
                user_id: record.user_id || "",
                user_name: record.user_name || "Unknown",
                action: record.action || "",
                resource_type: record.resource_type || "",
                resource_id: record.resource_id || "",
                details: record.details || "",
                ip_address: record.ip_address || "",
                user_agent: record.user_agent || "",
                timestamp: record.timestamp || record.created,
            }));

            set({
                logs: mappedLogs,
                totalCount: mappedLogs.length,
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load activity logs";
            console.error("Failed to fetch activity logs:", error);
            set({ error: message, isLoading: false });
        }
    },

    addLog: async (logData) => {
        try {
            await pb.collection("activity_logs").create(logData);
            await get().fetchLogs();
        } catch (error) {
            console.error("Failed to add activity log:", error);
        }
    },

    deleteLog: async (id) => {
        try {
            await pb.collection("activity_logs").delete(id);
            set((state) => ({
                logs: state.logs.filter((l) => l.id !== id),
                totalCount: state.totalCount - 1,
            }));
        } catch (error) {
            console.error("Failed to delete activity log:", error);
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));