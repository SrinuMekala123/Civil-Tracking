"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { OfficerDatabase } from "@/components/dashboard/officer-database";
import { MeetingsOverviewChart, ActivityLog, SystemSummary } from "@/components/dashboard/meetings-overview";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MeetingFormModal } from "@/app/meetings/components/meeting-form-modal";
import { useMeetingsStore } from "@/store/meetings-store";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const addMeeting = useMeetingsStore((s) => s.addMeeting);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (values: { [key: string]: unknown }) => {
    setSubmitting(true);
    const v = values as {
      officer_id: string;
      officer_name: string;
      officer_type: "IAS" | "IPS";
      designation: string;
      department: string;
      meeting_date: string;
      meeting_time: string;
      duration: number;
      location: string;
      agenda: string;
      status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
      attendees?: string;
      notes?: string;
      documents?: string;
      created_by: string;
      follow_up_date?: string;
    };
    const newMeeting = {
      officer_id: v.officer_id || "",
      officer_name: v.officer_name || "",
      officer_type: v.officer_type || "IAS",
      designation: v.designation || "",
      department: v.department || "",
      meeting_date: v.meeting_date || "",
      meeting_time: v.meeting_time || "",
      duration: Number(v.duration || 60),
      location: v.location || "",
      agenda: v.agenda || "",
      status: v.status || "Scheduled",
      attendees: v.attendees ? v.attendees.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean) : [],
      notes: v.notes || "",
      documents: v.documents ? v.documents.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean) : [],
      created_by: v.created_by || "Admin",
      follow_up_date: v.follow_up_date || "",
    };
    try {
      await addMeeting(newMeeting);
      setFormOpen(false);
      setSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to add meeting:", error);
      setSubmitting(false);
    }
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Dynamic Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-950">
          {/* Subtle glowing elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {getGreeting()}, {user?.name || user?.role || "User"}! 👋
              </h1>
              <p className="text-indigo-200/80 text-sm max-w-xl">
                Welcome to your smart tracking dashboard. Monitor live IAS/IPS cadre records, manage scheduled board meetings, download system metrics, and track updates dynamically.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button 
                onClick={() => setFormOpen(true)} 
                className="gradient-button rounded-xl px-5 py-6 text-sm font-semibold tracking-wide border border-white/10 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingMeetings />
          <RecentUpdates />
        </div>

        <OfficerDatabase />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MeetingsOverviewChart />
          <ActivityLog />
        </div>

        <SystemSummary />

        <MeetingFormModal open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAdd} isSubmitting={submitting} />
      </div>
    </DashboardLayout>
  );
}
