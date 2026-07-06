"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

interface UnifiedEvent {
  id: string;
  type: string;
  month: string;
  day: string;
  name: string;
  title: string;
  designation: string;
  time: string;
  status: string;
  dateStr: string;
  timeStr: string;
}

const typeBadges: Record<string, string> = {
  meeting: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20",
  appointment: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
  follow_up: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20",
  training: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20",
  inspection: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20",
};

export function UpcomingMeetings() {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpcomingEvents() {
      try {
        const todayStr = new Date().toISOString().split("T")[0];

        const [meetingsRes, eventsRes] = await Promise.all([
          pb.collection("meetings").getList(1, 10, {
            filter: `status = "Scheduled" && meeting_date >= "${todayStr}"`,
            sort: "meeting_date,meeting_time",
          }).catch(() => ({ items: [] })),
          pb.collection("calendar_events").getList(1, 10, {
            filter: `start_date >= "${todayStr}"`,
            sort: "start_date,start_time",
            expand: "ias_officer_id,ips_officer_id",
          }).catch(() => ({ items: [] })),
        ]);

        const mappedMeetings: UnifiedEvent[] = meetingsRes.items.map((record) => {
          let month = "JUL";
          let day = "4";
          if (record.meeting_date) {
            const cleanDateStr = record.meeting_date.split(/[ T]/)[0];
            const parts = cleanDateStr.split("-");
            if (parts.length === 3) {
              const [y, m, dNum] = parts;
              const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(dNum));
              month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
              day = dateObj.getDate().toString();
            }
          }

          let timeFormatted = record.meeting_time || "";
          if (timeFormatted && timeFormatted.includes(":")) {
            const [h, m] = timeFormatted.split(":");
            const hours = parseInt(h);
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            timeFormatted = `${displayHours}:${m} ${ampm}`;
          }

          return {
            id: record.id,
            type: "meeting",
            month,
            day,
            name: record.officer_name || "N/A",
            title: record.agenda || "Scheduled Meeting",
            designation: record.designation || "N/A",
            time: timeFormatted || "N/A",
            status: record.status || "Scheduled",
            dateStr: record.meeting_date || "",
            timeStr: record.meeting_time || "",
          };
        });

        const mappedEvents: UnifiedEvent[] = eventsRes.items.map((record) => {
          let month = "JUL";
          let day = "4";
          if (record.start_date) {
            const cleanDateStr = record.start_date.split(/[ T]/)[0];
            const parts = cleanDateStr.split("-");
            if (parts.length === 3) {
              const [y, m, dNum] = parts;
              const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(dNum));
              month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
              day = dateObj.getDate().toString();
            }
          }

          let timeFormatted = record.start_time || "";
          if (timeFormatted && timeFormatted.includes(":")) {
            const [h, m] = timeFormatted.split(":");
            const hours = parseInt(h);
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            timeFormatted = `${displayHours}:${m} ${ampm}`;
          }

          const iasOfficer = record.expand?.ias_officer_id?.[0] || record.expand?.ias_officer_id;
          const ipsOfficer = record.expand?.ips_officer_id?.[0] || record.expand?.ips_officer_id;
          const officerName = iasOfficer?.name || ipsOfficer?.name || "N/A";
          const designation = iasOfficer?.designation || ipsOfficer?.designation || "Calendar Event";

          return {
            id: record.id,
            type: record.event_type || "appointment",
            month,
            day,
            name: officerName,
            title: record.title || "Calendar Event",
            designation: designation,
            time: timeFormatted || "N/A",
            status: record.status || "Scheduled",
            dateStr: record.start_date || "",
            timeStr: record.start_time || "",
          };
        });

        const allEvents = [...mappedMeetings, ...mappedEvents];
        allEvents.sort((a, b) => {
          const dateCompare = a.dateStr.localeCompare(b.dateStr);
          if (dateCompare !== 0) return dateCompare;
          return a.timeStr.localeCompare(b.timeStr);
        });

        setEvents(allEvents.slice(0, 5));
      } catch (error) {
        console.error("Failed to load upcoming events:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUpcomingEvents();
  }, []);

  const getFormatTypeLabel = (type: string) => {
    if (type === "meeting") return "Meeting";
    if (type === "follow_up") return "Follow up";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card className="glass-premium border-0 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/20 border border-indigo-500/15">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">Upcoming Events</CardTitle>
          </div>
          <Link href="/meetings?view=calendar">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">View Calendar</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            No upcoming events scheduled.
          </div>
        ) : (
          <div className="space-y-3.5">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/10">
                  <span className="text-[10px] font-extrabold tracking-wider leading-none mb-0.5">{event.month}</span>
                  <span className="text-sm font-black leading-none">{event.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{event.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {event.name} ({event.designation})
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {event.time}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadges[event.type] || typeBadges.appointment}`}>
                    {getFormatTypeLabel(event.type)}
                  </span>
                  <Link href="/meetings?view=calendar">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/meetings">
            <Button variant="link" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-semibold">
              View all calendar events →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
