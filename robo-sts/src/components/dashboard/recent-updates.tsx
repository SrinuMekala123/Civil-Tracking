"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

interface MappedUpdate {
  id: string;
  officer: string;
  completedOn: string;
  updatedOn: string;
  status: string;
  created_by: string;
}

export function RecentUpdates() {
  const [filter, setFilter] = useState("All");
  const [updates, setUpdates] = useState<MappedUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpdates() {
      setLoading(true);
      try {
        let filterStr = "";
        if (filter === "Completed") {
          filterStr = 'status = "Completed" || status = "completed"';
        } else if (filter === "Pending") {
          filterStr = 'status = "Scheduled" || status = "scheduled"';
        }

        const [meetingsRes, eventsRes] = await Promise.all([
          pb.collection("meetings").getList(1, 5, {
            filter: filterStr || undefined,
            sort: "-updated",
          }).catch(() => ({ items: [] })),
          pb.collection("calendar_events").getList(1, 5, {
            filter: filterStr || undefined,
            sort: "-updated",
          }).catch(() => ({ items: [] })),
        ]);

        const mappedMeetings = meetingsRes.items.map((record: any) => {
          const completedDate = record.meeting_date
            ? new Date(record.meeting_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";
            
          const updatedOn = record.updated
            ? new Date(record.updated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }) +
              " at " +
              new Date(record.updated).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";

          return {
            id: record.id,
            officer: record.officer_name || "N/A",
            completedOn: completedDate,
            updatedOn: updatedOn,
            status: record.status || "Scheduled",
            created_by: record.created_by || "Admin",
          };
        });

        const mappedEvents = eventsRes.items.map((record: any) => {
          const completedDate = record.start_date
            ? new Date(record.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";
            
          const updatedOn = record.updated
            ? new Date(record.updated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }) +
              " at " +
              new Date(record.updated).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";

          return {
            id: record.id,
            officer: record.officer_name || "N/A",
            completedOn: completedDate,
            updatedOn: updatedOn,
            status: record.status || "scheduled",
            created_by: record.created_by || "Admin",
          };
        });

        const allUpdates = [...mappedMeetings, ...mappedEvents];
        allUpdates.sort((a, b) => new Date(b.updatedOn).getTime() - new Date(a.updatedOn).getTime());

        setUpdates(allUpdates.slice(0, 5));
      } catch (error) {
        console.error("Failed to load recent updates:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUpdates();
  }, [filter]);

  return (
    <Card className="glass-premium border-0 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border border-emerald-500/15">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">Recent Updates</CardTitle>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            No updates found.
          </div>
        ) : (
          <div className="space-y-3.5">
            {updates.map((update) => (
              <div key={update.id} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border border-emerald-500/15 flex items-center justify-center shadow-sm">
                      {update.status === "Completed" || update.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Meeting with {update.officer}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scheduled: {update.completedOn}</p>
                  <p className="text-xs text-slate-400 mt-1">Updated: {update.updatedOn}</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-xs font-semibold rounded-lg px-2.5 py-0.5">
                  {update.created_by || "Admin"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/meetings">
            <Button variant="link" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-semibold">
              View all updates →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
