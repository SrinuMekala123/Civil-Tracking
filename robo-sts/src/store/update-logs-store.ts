"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { UpdateLog } from "@/types";

interface UpdateLogsState {
    logs: UpdateLog[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;

    fetchLogs: (filters?: {
        priority?: string;
        updateType?: string;
        search?: string;
    }) => Promise<void>;
    addLog: (log: Partial<UpdateLog>) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUpdateLogsStore = create<UpdateLogsState>((set, get) => ({
    logs: [],
    isLoading: false,
    error: null,
    totalCount: 0,

    fetchLogs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const parts: string[] = [];
            if (filters?.priority && filters.priority !== "all") {
                parts.push(`priority = "${filters.priority}"`);
            }
            if (filters?.updateType && filters.updateType !== "all") {
                parts.push(`update_type~"${filters.updateType}"`);
            }
            if (filters?.search) {
                const q = filters.search;
                parts.push(`(officer_name~"${q}" || description~"${q}" || update_type~"${q}")`);
            }
            const filter = parts.length ? parts.join(" && ") : undefined;

            const result = await pb.collection("update_logs").getFullList({
                sort: "-completed_at",
                filter,
            });

            const mappedLogs: UpdateLog[] = result.map((record) => ({
                id: record.id,
                meeting_id: record.meeting_id || "",
                officer_name: record.officer_name || "",
                update_type: record.update_type || "",
                description: record.description || "",
                previous_value: record.previous_value || "",
                new_value: record.new_value || "",
                completed_at: record.completed_at || record.created,
                updated_by: record.updated_by || "",
                priority: record.priority as "Low" | "Medium" | "High" || "Low",
                attachments: Array.isArray(record.attachments) ? record.attachments : [],
                created: record.created,
            }));

            set({
                logs: mappedLogs,
                totalCount: mappedLogs.length,
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load update logs";
            console.error("Failed to fetch update logs:", error);
            set({ error: message, isLoading: false });
        }
    },

    addLog: async (logData) => {
        try {
            await pb.collection("update_logs").create(logData);
            await get().fetchLogs();
        } catch (error) {
            console.error("Failed to add log:", error);
        }
    },

    deleteLog: async (id) => {
        try {
            await pb.collection("update_logs").delete(id);
            set((state) => ({
                logs: state.logs.filter((l) => l.id !== id),
                totalCount: state.totalCount - 1,
            }));
        } catch (error) {
            console.error("Failed to delete log:", error);
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));