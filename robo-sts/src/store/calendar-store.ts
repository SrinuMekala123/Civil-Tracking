"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { CalendarEvent } from "@/types";

interface CalendarState {
    events: CalendarEvent[];
    isLoading: boolean;
    error: string | null;
    fetchEvents: () => Promise<void>;
    addEvent: (event: Partial<CalendarEvent>) => Promise<void>;
    updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    events: [],
    isLoading: false,
    error: null,

    fetchEvents: async () => {
        set({ isLoading: true, error: null });
        try {
            // Fetch calendar events and meetings in parallel
            const [eventsResult, meetingsResult] = await Promise.all([
                pb.collection("calendar_events").getFullList({
                    sort: "start_date,start_time",
                    expand: "ias_officer_id,ips_officer_id",
                }).catch((err) => {
                    console.error("Failed to fetch calendar events:", err);
                    return [];
                }),
                pb.collection("meetings").getFullList({
                    sort: "meeting_date,meeting_time",
                }).catch((err) => {
                    console.error("Failed to fetch meetings for calendar:", err);
                    return [];
                }),
            ]);

            const cleanDate = (dStr: string) => dStr ? dStr.split(/[ T]/)[0] : "";

            const mappedEvents: CalendarEvent[] = eventsResult.map((record) => {
                // Determine officer details from expanded relations
                const iasOfficer = record.expand?.ias_officer_id?.[0];
                const ipsOfficer = record.expand?.ips_officer_id?.[0];

                let officerName = "";
                let officerType: "IAS" | "IPS" | undefined = undefined;
                let officerCadre = "";

                if (iasOfficer) {
                    officerName = iasOfficer.name;
                    officerType = "IAS";
                    officerCadre = iasOfficer.cadre || "";
                } else if (ipsOfficer) {
                    officerName = ipsOfficer.name;
                    officerType = "IPS";
                    officerCadre = ipsOfficer.cadre || "";
                }

                return {
                    id: record.id,
                    title: record.title,
                    event_type: record.event_type,
                    start_date: cleanDate(record.start_date),
                    start_time: record.start_time,
                    end_date: cleanDate(record.end_date || ""),
                    end_time: record.end_time || "",
                    status: (record.status || "scheduled").charAt(0).toUpperCase() + (record.status || "scheduled").slice(1),
                    location: record.location || "",
                    description: record.description || "",
                    color: record.color || "",
                    ias_officer_id: record.ias_officer_id || "",
                    ips_officer_id: record.ips_officer_id || "",
                    officer_name: officerName,
                    officer_type: officerType,
                    officer_cadre: officerCadre,
                };
            });

            const mappedMeetings: CalendarEvent[] = meetingsResult.map((record) => {
                const status = record.status || "Scheduled";
                const title = `Meeting: ${record.agenda || "Scheduled Meeting"}`;

                return {
                    id: `meeting-${record.id}`,
                    title,
                    event_type: "meeting",
                    start_date: cleanDate(record.meeting_date || ""),
                    start_time: record.meeting_time || "",
                    end_date: cleanDate(record.meeting_date || ""),
                    end_time: "",
                    status,
                    location: record.location || "",
                    description: record.notes || record.agenda || "",
                    color: "bg-blue-500",
                    ias_officer_id: record.officer_type === "IAS" ? record.officer_id : "",
                    ips_officer_id: record.officer_type === "IPS" ? record.officer_id : "",
                    officer_name: record.officer_name || "",
                    officer_type: record.officer_type as "IAS" | "IPS" || "IAS",
                    officer_cadre: "",
                };
            });

            const allEvents = [...mappedEvents, ...mappedMeetings];
            allEvents.sort((a, b) => {
                const dateCompare = a.start_date.localeCompare(b.start_date);
                if (dateCompare !== 0) return dateCompare;
                return a.start_time.localeCompare(b.start_time);
            });

            set({ events: allEvents, isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch events";
            console.error("Failed to fetch calendar events:", error);
            set({ error: message, isLoading: false });
        }
    },

    addEvent: async (eventData) => {
        try {
            await pb.collection("calendar_events").create(eventData);
            try {
                await pb.collection("notifications").create({
                    title: "New Event Added",
                    message: `Added calendar event: "${eventData.title || 'N/A'}" on ${eventData.start_date || 'N/A'} at ${eventData.start_time || 'N/A'}`,
                    time: new Date().toISOString(),
                    read: false,
                    type: "success"
                });
            } catch (e) {
                console.error("Failed to add notification for new event:", e);
            }
            await get().fetchEvents();
        } catch (error: any) {
            console.error("Failed to add event:", error);
            console.error("Error response data:", error?.response?.data);
            console.error("Error response status:", error?.response?.status);
            const message = error?.message || "Failed to add event";
            set({ error: message });
        }
    },

    updateEvent: async (id, data) => {
        try {
            const oldEvent = get().events.find((e) => e.id === id);
            if (id.startsWith("meeting-")) {
                const meetingId = id.replace("meeting-", "");
                const meetingData: any = {};
                if (data.title) {
                    meetingData.agenda = data.title.replace(/^Meeting:\s*/, "");
                }
                if (data.start_date) meetingData.meeting_date = data.start_date;
                if (data.start_time) meetingData.meeting_time = data.start_time;
                if (data.location) meetingData.location = data.location;
                if (data.status) meetingData.status = data.status;
                if (data.description) meetingData.notes = data.description;

                await pb.collection("meetings").update(meetingId, meetingData);

                if (oldEvent) {
                    const changes: string[] = [];
                    const titleChanged = data.title && data.title !== oldEvent.title;
                    if (titleChanged) changes.push(`"Title" from "${oldEvent.title}" to "${data.title}"`);
                    const start_dateChanged = data.start_date && data.start_date !== oldEvent.start_date;
                    if (start_dateChanged) changes.push(`"Start Date" from "${oldEvent.start_date}" to "${data.start_date}"`);
                    const start_timeChanged = data.start_time && data.start_time !== oldEvent.start_time;
                    if (start_timeChanged) changes.push(`"Start Time" from "${oldEvent.start_time}" to "${data.start_time}"`);
                    const locationChanged = data.location !== undefined && data.location !== oldEvent.location;
                    if (locationChanged) changes.push(`"Location" from "${oldEvent.location || 'N/A'}" to "${data.location || 'N/A'}"`);
                    const statusChanged = data.status && data.status !== oldEvent.status;
                    if (statusChanged) changes.push(`"Status" from "${oldEvent.status}" to "${data.status}"`);

                    if (changes.length > 0) {
                        try {
                            await pb.collection("notifications").create({
                                title: "Meeting Updated (via Calendar)",
                                message: `Updated meeting "${oldEvent.title}": changed ${changes.join(", ")}`,
                                time: new Date().toISOString(),
                                read: false,
                                type: "info"
                            });
                        } catch (e) {
                            console.error("Failed to add notification for updated meeting via calendar:", e);
                        }
                    }
                }
            } else {
                await pb.collection("calendar_events").update(id, data);
                if (oldEvent) {
                    const changes: string[] = [];
                    for (const [key, value] of Object.entries(data)) {
                        if (key === "updated" || key === "id" || key === "created" || key === "color") continue;
                        const oldVal = (oldEvent as any)[key];
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
                                title: "Event Updated",
                                message: `Updated event "${oldEvent.title}": changed ${changes.join(", ")}`,
                                time: new Date().toISOString(),
                                read: false,
                                type: "info"
                            });
                        } catch (e) {
                            console.error("Failed to add notification for updated event:", e);
                        }
                    }
                }
            }
            await get().fetchEvents();
        } catch (error) {
            console.error("Failed to update event:", error);
        }
    },

    deleteEvent: async (id) => {
        try {
            const oldEvent = get().events.find((e) => e.id === id);
            if (id.startsWith("meeting-")) {
                const meetingId = id.replace("meeting-", "");
                await pb.collection("meetings").delete(meetingId);
                if (oldEvent) {
                    try {
                        await pb.collection("notifications").create({
                            title: "Meeting Deleted (via Calendar)",
                            message: `Deleted meeting: "${oldEvent.title}"`,
                            time: new Date().toISOString(),
                            read: false,
                            type: "warning"
                        });
                    } catch (e) {
                        console.error("Failed to add notification for deleted meeting via calendar:", e);
                    }
                }
            } else {
                await pb.collection("calendar_events").delete(id);
                if (oldEvent) {
                    try {
                        await pb.collection("notifications").create({
                            title: "Event Deleted",
                            message: `Deleted event: "${oldEvent.title}"`,
                            time: new Date().toISOString(),
                            read: false,
                            type: "warning"
                        });
                    } catch (e) {
                        console.error("Failed to add notification for deleted event:", e);
                    }
                }
            }
            set((state) => ({
                events: state.events.filter((e) => e.id !== id),
            }));
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    },
}));