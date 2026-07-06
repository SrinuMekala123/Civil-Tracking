"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { Meeting } from "@/types";
import { createUpdateLog } from "@/lib/logging-utils";

interface MeetingsState {
    meetings: Meeting[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    pageSize: number;

    fetchMeetings: (page?: number, pageSize?: number, filters?: {
        officerType?: string;
        status?: string;
        department?: string;
        search?: string;
    }) => Promise<void>;
    addMeeting: (meeting: Partial<Meeting>) => Promise<void>;
    updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;

    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useMeetingsStore = create<MeetingsState>((set, get) => ({
    meetings: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,

    fetchMeetings: async (page = 1, pageSize = 20, filters) => {
        set({ isLoading: true, error: null, currentPage: page, pageSize });
        try {
            const parts: string[] = [];
            if (filters?.officerType && filters.officerType !== "all") {
                parts.push(`officer_type = "${filters.officerType}"`);
            }
            if (filters?.status && filters.status !== "all") {
                parts.push(`status = "${filters.status}"`);
            }
            if (filters?.department && filters.department !== "all") {
                parts.push(`department~"${filters.department}"`);
            }
            if (filters?.search) {
                const q = filters.search;
                parts.push(`(officer_name~"${q}" || agenda~"${q}" || location~"${q}" || designation~"${q}")`);
            }
            const filter = parts.length ? parts.join(" && ") : undefined;

            const result = await pb.collection("meetings").getList(page, pageSize, {
                sort: "-meeting_date,-meeting_time",
                filter,
            });

            const mappedMeetings: Meeting[] = result.items.map((record) => ({
                id: record.id,
                officer_id: record.officer_id || "",
                officer_name: record.officer_name || "",
                officer_type: record.officer_type as "IAS" | "IPS" || "IAS",
                designation: record.designation || "",
                department: record.department || "",
                meeting_date: record.meeting_date || "",
                meeting_time: record.meeting_time || "",
                duration: record.duration || 0,
                location: record.location || "",
                agenda: record.agenda || "",
                status: record.status as "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" || "Scheduled",
                attendees: Array.isArray(record.attendees) ? record.attendees : [],
                notes: record.notes || "",
                documents: Array.isArray(record.documents) ? record.documents : [],
                created_by: record.created_by || "",
                follow_up_date: record.follow_up_date || "",
                created: record.created,
                updated: record.updated,
            }));

            set({
                meetings: mappedMeetings,
                totalCount: result.totalItems,
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load meetings";
            console.error("Failed to fetch meetings:", error);
            set({ error: message, isLoading: false });
        }
    },

    addMeeting: async (meetingData) => {
        try {
            const created = await pb.collection("meetings").create(meetingData);
            try {
                await pb.collection("notifications").create({
                    title: "New Meeting Scheduled",
                    message: `Scheduled meeting: "${meetingData.agenda || 'N/A'}" with ${meetingData.officer_name || 'N/A'} on ${meetingData.meeting_date || 'N/A'} at ${meetingData.meeting_time || 'N/A'}`,
                    time: new Date().toISOString(),
                    read: false,
                    type: "success"
                });
            } catch (e) {
                console.error("Failed to add notification for new meeting:", e);
            }
            try {
                await createUpdateLog({
                    meeting_id: created.id,
                    officer_name: meetingData.officer_name || "Multiple Officers",
                    update_type: "Meeting Scheduled",
                    description: `Scheduled meeting: "${meetingData.agenda || 'N/A'}" with ${meetingData.officer_name || 'N/A'} on ${meetingData.meeting_date || 'N/A'}`,
                    new_value: `Date: ${meetingData.meeting_date || 'N/A'}, Status: ${meetingData.status || 'Scheduled'}`,
                    priority: "Low"
                });
            } catch (e) {
                console.error("Failed to log addMeeting to update_logs:", e);
            }
            await get().fetchMeetings(get().currentPage, get().pageSize);
        } catch (error) {
            console.error("Failed to add meeting:", error);
        }
    },

    updateMeeting: async (id, data) => {
        try {
            const oldMeeting = get().meetings.find((m) => m.id === id);
            await pb.collection("meetings").update(id, data);
            if (oldMeeting) {
                const changes: string[] = [];
                for (const [key, value] of Object.entries(data)) {
                    if (key === "updated" || key === "id" || key === "created" || key === "documents") continue;
                    const oldVal = (oldMeeting as any)[key];
                    const oldStr = Array.isArray(oldVal) ? oldVal.join(", ") : String(oldVal !== undefined && oldVal !== null ? oldVal : "");
                    const newStr = Array.isArray(value) ? value.join(", ") : String(value !== undefined && value !== null ? value : "");
                    if (oldStr !== newStr) {
                        const niceKey = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        changes.push(`"${niceKey}" from "${oldStr || 'N/A'}" to "${newStr || 'N/A'}"`);
                    }
                }
                if (changes.length > 0) {
                    try {
                        await pb.collection("notifications").create({
                            title: "Meeting Updated",
                            message: `Updated meeting with ${oldMeeting.officer_name}: changed ${changes.join(", ")}`,
                            time: new Date().toISOString(),
                            read: false,
                            type: "info"
                        });
                    } catch (e) {
                        console.error("Failed to add notification for update meeting:", e);
                    }
                    try {
                        await createUpdateLog({
                            meeting_id: id,
                            officer_name: oldMeeting.officer_name || "Multiple Officers",
                            update_type: data.status !== undefined && data.status !== oldMeeting.status ? "Meeting Status Changed" : "Meeting Updated",
                            description: `Updated meeting "${oldMeeting.agenda}": changed ${changes.join(", ")}`,
                            previous_value: `Original details`,
                            new_value: changes.join(", "),
                            priority: data.status === "Cancelled" || data.status === "Completed" ? "Medium" : "Low"
                        });
                    } catch (e) {
                        console.error("Failed to log updateMeeting to update_logs:", e);
                    }
                }
            }
            await get().fetchMeetings(get().currentPage, get().pageSize);
        } catch (error) {
            console.error("Failed to update meeting:", error);
        }
    },

    deleteMeeting: async (id) => {
        try {
            const oldMeeting = get().meetings.find((m) => m.id === id);
            await pb.collection("meetings").delete(id);
            if (oldMeeting) {
                try {
                    await pb.collection("notifications").create({
                        title: "Meeting Cancelled / Deleted",
                        message: `Deleted meeting: "${oldMeeting.agenda || 'N/A'}" with ${oldMeeting.officer_name || 'N/A'}`,
                        time: new Date().toISOString(),
                        read: false,
                        type: "warning"
                    });
                } catch (e) {
                    console.error("Failed to add notification for deleted meeting:", e);
                }
                try {
                    await createUpdateLog({
                        meeting_id: id,
                        officer_name: oldMeeting.officer_name || "Multiple Officers",
                        update_type: "Meeting Deleted",
                        description: `Deleted meeting: "${oldMeeting.agenda || 'N/A'}" with ${oldMeeting.officer_name || 'N/A'}`,
                        previous_value: `Agenda: ${oldMeeting.agenda}`,
                        priority: "High"
                    });
                } catch (e) {
                    console.error("Failed to log deleteMeeting to update_logs:", e);
                }
            }
            set((state) => ({
                meetings: state.meetings.filter((m) => m.id !== id),
            }));
            await get().fetchMeetings(get().currentPage, get().pageSize);
        } catch (error) {
            console.error("Failed to delete meeting:", error);
        }
    },

    bulkDelete: async (ids) => {
        try {
            const deletedMeetings = get().meetings.filter((m) => ids.includes(m.id)).map((m) => `"${m.agenda}" with ${m.officer_name}`);
            const deletedNames = get().meetings.filter((m) => ids.includes(m.id)).map((m) => m.agenda || "N/A");
            for (const id of ids) {
                await pb.collection("meetings").delete(id);
            }
            if (deletedMeetings.length > 0) {
                try {
                    await pb.collection("notifications").create({
                        title: "Multiple Meetings Cancelled / Deleted",
                        message: `Deleted meetings: ${deletedMeetings.join(", ")}`,
                        time: new Date().toISOString(),
                        read: false,
                        type: "warning"
                    });
                } catch (e) {
                    console.error("Failed to add notification for bulk delete meetings:", e);
                }
                try {
                    await createUpdateLog({
                        update_type: "Meetings Bulk Delete",
                        description: `Bulk deleted ${deletedNames.length} Scheduled Meetings: ${deletedNames.join(", ")}`,
                        previous_value: deletedNames.join(", "),
                        priority: "High"
                    });
                } catch (e) {
                    console.error("Failed to log bulkDelete to update_logs:", e);
                }
            }
            set((state) => ({
                meetings: state.meetings.filter((m) => !ids.includes(m.id)),
            }));
            await get().fetchMeetings(get().currentPage, get().pageSize);
        } catch (error) {
            console.error("Failed to bulk delete:", error);
        }
    },

    setCurrentPage: (page) => set({ currentPage: page }),
    setPageSize: (size) => set({ pageSize: size }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));