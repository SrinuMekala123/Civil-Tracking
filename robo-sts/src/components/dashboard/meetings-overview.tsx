"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BarChart3, User, CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 shadow-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function formatRelativeTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } catch {
    return "Recently";
  }
}

export function MeetingsOverviewChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ scheduled: 0, completed: 0, pending: 0, rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meetings, events] = await Promise.all([
          pb.collection("meetings").getFullList({
            fields: "status,meeting_date",
          }),
          pb.collection("calendar_events").getFullList({
            fields: "status,start_date",
          }),
        ]);

        const allItems = [
          ...meetings.map((m: any) => ({ ...m, _type: "meeting" })),
          ...events.map((e: any) => ({ ...e, _type: "event", meeting_date: e.start_date })),
        ];

        const scheduled = allItems.filter((m) => m.status === "Scheduled" || m.status === "scheduled").length;
        const completed = allItems.filter((m) => m.status === "Completed" || m.status === "completed").length;
        const pending = allItems.filter((m) => m.status === "Scheduled" || m.status === "scheduled" || m.status === "Rescheduled" || m.status === "rescheduled").length;
        const rate = allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;
        setStats({ scheduled, completed, pending, rate });

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const weeks = [
          { name: "1-7", start: 1, end: 7, scheduled: 0, completed: 0 },
          { name: "8-14", start: 8, end: 14, scheduled: 0, completed: 0 },
          { name: "15-21", start: 15, end: 21, scheduled: 0, completed: 0 },
          { name: "22-28", start: 22, end: 28, scheduled: 0, completed: 0 },
          { name: "29+", start: 29, end: 31, scheduled: 0, completed: 0 },
        ];

        allItems.forEach((m: any) => {
          if (!m.meeting_date) return;
          const d = new Date(m.meeting_date);
          if (d.getFullYear() === year && d.getMonth() === month) {
            const dateVal = d.getDate();
            const week = weeks.find((w) => dateVal >= w.start && dateVal <= w.end);
            if (week) {
              if (m.status === "Completed" || m.status === "completed") {
                week.completed += 1;
              } else if (m.status === "Scheduled" || m.status === "scheduled" || m.status === "Rescheduled" || m.status === "rescheduled") {
                week.scheduled += 1;
              }
            }
          }
        });

        const monthName = today.toLocaleString("en-US", { month: "short" });
        const formatted = weeks.map((w) => ({
          name: `${w.name} ${monthName}`,
          scheduled: w.scheduled,
          completed: w.completed,
        }));

        setChartData(formatted);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-lg font-bold">Meetings Overview</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-800/50">This Month</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>This Month</DropdownMenuItem>
              <DropdownMenuItem>Last Month</DropdownMenuItem>
              <DropdownMenuItem>This Quarter</DropdownMenuItem>
              <DropdownMenuItem>This Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="h-[250px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis
                  dataKey="name"
                  className="text-xs text-slate-500 dark:text-slate-400"
                  tick={{ fill: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  tickLine={{ stroke: "currentColor" }}
                />
                <YAxis
                  className="text-xs text-slate-500 dark:text-slate-400"
                  tick={{ fill: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  tickLine={{ stroke: "currentColor" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="scheduled"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Scheduled"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3 mt-6">
          <div className="text-center p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/20">
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {loading ? "-" : stats.scheduled}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? "-" : stats.completed}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {loading ? "-" : stats.pending}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50/80 dark:bg-purple-900/20">
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {loading ? "-" : `${stats.rate}%`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completion Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityLog() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await pb.collection("activity_logs").getList(1, 5, {
          sort: "-created",
        });
        setActivities(res.items);
      } catch (error) {
        console.error("Failed to load activity logs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg font-bold">Activity Log</CardTitle>
          </div>
          <Link href="/activity">
            <Button variant="link" className="text-purple-600 dark:text-purple-400 text-sm p-0">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            No activities logged yet.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold flex-shrink-0">
                  {(activity.user_name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{activity.user_name || "User"}</span>{" "}
                    {activity.details || `${activity.action} ${activity.resource_type}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(activity.created)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/activity">
            <Button variant="link" className="text-purple-600 dark:text-purple-400 text-sm">
              View All Logs →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemSummary() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const [allMeetings, allEvents] = await Promise.all([
          pb.collection("meetings").getFullList({
            fields: "status,meeting_date",
          }),
          pb.collection("calendar_events").getFullList({
            fields: "status,start_date",
          }),
        ]);

        const combined = [
          ...allMeetings.map((m: any) => ({ ...m, _type: "meeting" })),
          ...allEvents.map((e: any) => ({ ...e, _type: "event", meeting_date: e.start_date })),
        ];

        const total = combined.length;
        const completed = combined.filter((item: any) => item.status === "Completed" || item.status === "completed").length;
        const pending = combined.filter((item: any) => item.status === "Scheduled" || item.status === "scheduled" || item.status === "Rescheduled" || item.status === "rescheduled").length;
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const overdue = combined.filter((item: any) => {
          if (!item.meeting_date) return false;
          const cleanMDate = item.meeting_date.split(/[ T]/)[0];
          return (item.status === "Scheduled" || item.status === "scheduled" || item.status === "Rescheduled" || item.status === "rescheduled") && cleanMDate < todayStr;
        }).length;

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({ total, completed, pending, overdue, rate });
      } catch (error) {
        console.error("Failed to load system summary:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.rate / 100) * circumference;

  return (
    <Card className="glass-card border-0">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <p className="text-lg font-bold tracking-wide">System Summary</p>
              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="text-sm">Calculating stats...</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
                    <BarChart3 className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-white/80">Total Meetings</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                    <div>
                      <p className="text-xs text-white/80">Completed</p>
                      <p className="text-xl font-bold">{stats.completed}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
                    <Clock className="w-5 h-5 text-amber-300" />
                    <div>
                      <p className="text-xs text-white/80">Pending</p>
                      <p className="text-xl font-bold">{stats.pending}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
                    <AlertCircle className="w-5 h-5 text-red-300" />
                    <div>
                      <p className="text-xs text-white/80">Overdue</p>
                      <p className="text-xl font-bold text-red-200">{stats.overdue}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="url(#footerProgress)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={loading ? circumference : offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="footerProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-300">
                    {loading ? "0" : stats.rate}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/80 mt-1 font-medium">Overall Completion</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 py-3">@2026 Civil Tracking. All rights reserved.</p>
      </CardContent>
    </Card>
  );
}
