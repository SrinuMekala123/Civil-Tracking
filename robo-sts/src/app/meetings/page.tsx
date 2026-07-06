"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "next/navigation";
import { useMeetingsStore } from "@/store/meetings-store";
import { useCalendarStore } from "@/store/calendar-store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Loader2,
  RefreshCcw,
  CheckSquare,
  Square,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  User,
  Trash2 as TrashIcon,
} from "lucide-react";
import type { Meeting, CalendarEvent } from "@/types";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { MeetingFormModal } from "@/app/meetings/components/meeting-form-modal";
import { MeetingDetailModal } from "@/app/meetings/components/meeting-detail-modal";
import { EventFormModal } from "@/app/calendar/components/event-form-modal";

const DEFAULT_PAGE_SIZE = 20;

// Colors for calendar statuses
const calendarStatusColors: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Rescheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Postponed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

// Colors for event types
const calendarTypeColors: Record<string, string> = {
  meeting: "border-l-4 border-l-blue-500",
  appointment: "border-l-4 border-l-emerald-500",
  follow_up: "border-l-4 border-l-amber-500",
  training: "border-l-4 border-l-purple-500",
  inspection: "border-l-4 border-l-red-500",
};

// Helper to format Date object into local YYYY-MM-DD string
const getLocalYYYYMMDD = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function MeetingsHubContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams?.get("view") === "calendar" ? "calendar" : "list";
  const [activeTab, setActiveTab] = useState<"list" | "calendar">(initialView);

  // Sync tab with query param if it changes
  useEffect(() => {
    const view = searchParams?.get("view");
    if (view === "calendar" || view === "list") {
      setActiveTab(view);
    }
  }, [searchParams]);

  // Meetings Store State
  const meetings = useMeetingsStore((s) => s.meetings);
  const isLoadingMeetings = useMeetingsStore((s) => s.isLoading);
  const meetingsError = useMeetingsStore((s) => s.error);
  const totalCount = useMeetingsStore((s) => s.totalCount);
  const currentPage = useMeetingsStore((s) => s.currentPage);
  const pageSize = useMeetingsStore((s) => s.pageSize);
  const fetchMeetings = useMeetingsStore((s) => s.fetchMeetings);
  const addMeeting = useMeetingsStore((s) => s.addMeeting);
  const updateMeeting = useMeetingsStore((s) => s.updateMeeting);
  const deleteMeeting = useMeetingsStore((s) => s.deleteMeeting);
  const bulkDelete = useMeetingsStore((s) => s.bulkDelete);

  // Meetings local UI states
  const [searchInput, setSearchInput] = useState("");
  const [officerTypeFilter, setOfficerTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchInput, 500);

  // Calendar Store State
  const calendarEvents = useCalendarStore((s) => s.events);
  const isLoadingCalendar = useCalendarStore((s) => s.isLoading);
  const calendarError = useCalendarStore((s) => s.error);
  const fetchEvents = useCalendarStore((s) => s.fetchEvents);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  // Calendar local UI states
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<string>("all");
  const [calendarTypeFilter, setCalendarTypeFilter] = useState<string>("all");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(new Date());
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [debouncedCalendarSearch] = useDebounce(calendarSearch, 500);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"meeting" | "event" | "bulk_meetings">("meeting");

  // Fetch Meetings
  useEffect(() => {
    if (activeTab === "list") {
      fetchMeetings(1, DEFAULT_PAGE_SIZE, {
        officerType: officerTypeFilter,
        status: statusFilter,
        department: departmentFilter,
        search: debouncedSearch || undefined,
      });
    }
  }, [activeTab, debouncedSearch, officerTypeFilter, statusFilter, departmentFilter, fetchMeetings]);

  // Fetch Calendar Events
  useEffect(() => {
    if (activeTab === "calendar") {
      fetchEvents();
    }
  }, [activeTab, fetchEvents]);

  const departments = useMemo(() => {
    const depts = new Set(meetings.map((m) => m.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [meetings]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      fetchMeetings(newPage, pageSize, {
        officerType: officerTypeFilter,
        status: statusFilter,
        department: departmentFilter,
        search: debouncedSearch || undefined,
      });
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const handleAddMeeting = async (values: any) => {
    setSubmittingMeeting(true);
    try {
      const mappedValues = {
        ...values,
        attendees: values.attendees ? values.attendees.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        documents: values.documents ? values.documents.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      };
      await addMeeting(mappedValues);
      setMeetingFormOpen(false);
    } catch (error) {
      console.error("Failed to add meeting:", error);
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleEditMeeting = async (values: any) => {
    if (!editingMeeting) return;
    setSubmittingMeeting(true);
    try {
      const mappedValues = {
        ...values,
        attendees: values.attendees ? values.attendees.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        documents: values.documents ? values.documents.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      };
      await updateMeeting(editingMeeting.id, mappedValues);
      setEditingMeeting(null);
    } catch (error) {
      console.error("Failed to update meeting:", error);
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleExportMeetings = async (type: "excel" | "pdf") => {
    try {
      const parts: string[] = [];
      if (officerTypeFilter && officerTypeFilter !== "all") {
        parts.push(`officer_type = "${officerTypeFilter}"`);
      }
      if (statusFilter && statusFilter !== "all") {
        parts.push(`status = "${statusFilter}"`);
      }
      if (departmentFilter && departmentFilter !== "all") {
        parts.push(`department~"${departmentFilter}"`);
      }
      if (debouncedSearch) {
        const q = debouncedSearch;
        parts.push(`(officer_name~"${q}" || agenda~"${q}" || location~"${q}" || designation~"${q}")`);
      }
      const filter = parts.length ? parts.join(" && ") : undefined;

      const records = await pb.collection("meetings").getFullList({
        sort: "-meeting_date,-meeting_time",
        filter,
      });

      const headers = [
        "Officer Name",
        "Officer Type",
        "Designation",
        "Department",
        "Meeting Date",
        "Meeting Time",
        "Duration (Mins)",
        "Location",
        "Agenda",
        "Status"
      ];

      const rows = records.map((r) => [
        r.officer_name || "",
        r.officer_type || "",
        r.designation || "",
        r.department || "",
        r.meeting_date || "",
        r.meeting_time || "",
        String(r.duration || 0),
        r.location || "",
        r.agenda || "",
        r.status || ""
      ]);

      const filename = `meetings_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "Meetings Log", headers, rows, {
          orientation: "landscape",
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  const clearMeetingsFilters = () => {
    setSearchInput("");
    setOfficerTypeFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    clearSelection();
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Rescheduled":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  // Calendar Navigation
  const handlePrevCalendar = () => {
    setCalendarCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === "month") d.setMonth(d.getMonth() - 1);
      else if (calendarView === "week") d.setDate(d.getDate() - 7);
      else if (calendarView === "day") d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextCalendar = () => {
    setCalendarCurrentDate((next) => {
      const d = new Date(next);
      if (calendarView === "month") d.setMonth(d.getMonth() + 1);
      else if (calendarView === "week") d.setDate(d.getDate() + 7);
      else if (calendarView === "day") d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleTodayCalendar = () => {
    setCalendarCurrentDate(new Date());
  };

  // Calendar Header Label
  const calendarHeaderLabel = useMemo(() => {
    if (calendarView === "month") {
      return calendarCurrentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (calendarView === "week") {
      const start = new Date(calendarCurrentDate);
      start.setDate(start.getDate() - start.getDay()); // start of week
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (calendarView === "day") {
      return calendarCurrentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    return "Agenda";
  }, [calendarView, calendarCurrentDate]);

  // Calendar Filtering
  const filteredEvents = useMemo(() => {
    let data = calendarEvents;
    if (calendarStatusFilter !== "all") data = data.filter((e) => e.status === calendarStatusFilter);
    if (calendarTypeFilter !== "all") data = data.filter((e) => e.event_type === calendarTypeFilter);
    if (debouncedCalendarSearch) {
      const q = debouncedCalendarSearch.toLowerCase();
      data = data.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.officer_name?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [calendarEvents, calendarStatusFilter, calendarTypeFilter, debouncedCalendarSearch]);

  // Filter events active for the displayed Month/Week/Day
  const displayedEvents = useMemo(() => {
    let data = filteredEvents;
    if (calendarView === "month") {
      const y = calendarCurrentDate.getFullYear();
      const m = calendarCurrentDate.getMonth();
      data = data.filter((e) => {
        const d = new Date(e.start_date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
    } else if (calendarView === "week") {
      const start = new Date(calendarCurrentDate);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      data = data.filter((e) => {
        const d = new Date(e.start_date);
        return d >= start && d < end;
      });
    } else if (calendarView === "day") {
      const activeStr = getLocalYYYYMMDD(calendarCurrentDate);
      data = data.filter((e) => e.start_date === activeStr);
    }
    return data;
  }, [filteredEvents, calendarView, calendarCurrentDate]);

  // Group events by date for Agenda view
  const agendaGrouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    displayedEvents.forEach((e) => {
      if (!map[e.start_date]) map[e.start_date] = [];
      map[e.start_date].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [displayedEvents]);

  // Monthly grid days generator (42 days grid)
  const monthDays = useMemo(() => {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: { date: string; dayNum: number; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Fill previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = getLocalYYYYMMDD(prevDate);
      days.push({
        date: dateStr,
        dayNum,
        isCurrentMonth: false,
        events: filteredEvents.filter((e) => e.start_date === dateStr),
      });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      const dateStr = getLocalYYYYMMDD(currDate);
      days.push({
        date: dateStr,
        dayNum: i,
        isCurrentMonth: true,
        events: filteredEvents.filter((e) => e.start_date === dateStr),
      });
    }

    // Fill next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = getLocalYYYYMMDD(nextDate);
      days.push({
        date: dateStr,
        dayNum: i,
        isCurrentMonth: false,
        events: filteredEvents.filter((e) => e.start_date === dateStr),
      });
    }

    return days;
  }, [calendarCurrentDate, filteredEvents]);

  // 7 days generator for Week View
  const weekDays = useMemo(() => {
    const start = new Date(calendarCurrentDate);
    start.setDate(start.getDate() - start.getDay());

    const days: { date: Date; dateStr: string; label: string; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalYYYYMMDD(d);
      days.push({
        date: d,
        dateStr,
        label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        events: filteredEvents.filter((e) => e.start_date === dateStr),
      });
    }
    return days;
  }, [calendarCurrentDate, filteredEvents]);

  // Day View events list
  const dayEvents = useMemo(() => {
    const activeStr = getLocalYYYYMMDD(calendarCurrentDate);
    return filteredEvents.filter((e) => e.start_date === activeStr);
  }, [calendarCurrentDate, filteredEvents]);

  // Sidebar events lists
  const todayStr = getLocalYYYYMMDD(new Date());
  const todayEvents = filteredEvents.filter((e) => e.start_date === todayStr);
  const upcomingEventsList = filteredEvents.filter((e) => e.start_date > todayStr).slice(0, 5);

  const handleAddEvent = async (values: any) => {
    setSubmittingEvent(true);
    try {
      await addEvent(values);
      setEventFormOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleEditEvent = async (values: any) => {
    if (!editingEvent) return;
    setSubmittingEvent(true);
    try {
      await updateEvent(editingEvent.id, values);
      setEditingEvent(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleExportCalendar = (type: "excel" | "pdf") => {
    try {
      const headers = [
        "Title",
        "Event Type",
        "Start Date",
        "Start Time",
        "End Date",
        "End Time",
        "Officer Name",
        "Officer Type",
        "Location",
        "Description",
        "Status"
      ];

      const rows = filteredEvents.map((e) => [
        e.title || "",
        e.event_type || "meeting",
        e.start_date || "",
        e.start_time || "",
        e.end_date || "",
        e.end_time || "",
        e.officer_name || "",
        e.officer_type || "",
        e.location || "",
        e.description || "",
        e.status || ""
      ]);

      const filename = `calendar_events_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "Calendar Events", headers, rows, {
          orientation: "landscape",
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Tab Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meetings & Calendar Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === "list"
              ? `${totalCount.toLocaleString()} meeting${totalCount !== 1 ? "s" : ""} found`
              : `${filteredEvents.length} calendar event${filteredEvents.length !== 1 ? "s" : ""} matching filters`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200/20">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Meetings List
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "calendar"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar View
            </button>
          </div>

          {/* Action Buttons depending on active tab */}
          {activeTab === "list" ? (
            <div className="flex items-center gap-2">
              <Button className="gradient-button" onClick={() => setMeetingFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add New Meeting
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportMeetings("excel")}>
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportMeetings("pdf")}>
                <Download className="h-4 w-4 mr-2" /> PDF
              </Button>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteType("bulk_meetings");
                    setDeleteId(null);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <TrashIcon className="h-4 w-4 mr-2" /> Delete ({selectedIds.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Calendar Navigation and View */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevCalendar}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleTodayCalendar}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextCalendar}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(["agenda", "month", "week", "day"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                      calendarView === v ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <Button size="sm" className="gradient-button" onClick={() => setEventFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Event
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportCalendar("excel")}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportCalendar("pdf")}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab specific Filters and Content */}
      {activeTab === "list" ? (
        <>
          {/* Meetings Filters */}
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search meetings by officer name, agenda, location, department..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  <Select value={officerTypeFilter} onValueChange={(value) => setOfficerTypeFilter(value || "all")}>
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue>
                        {officerTypeFilter === "all" ? "All Types" : (officerTypeFilter || "Officer Type")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="IAS">IAS</SelectItem>
                      <SelectItem value="IPS">IPS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value || "all")}>
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue>
                        {departmentFilter === "all" ? "All Departments" : (departmentFilter || "Department")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept || "N/A"}>
                          {dept || "N/A"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue>
                        {statusFilter === "all" ? "All Status" : (statusFilter || "Status")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" onClick={clearMeetingsFilters}>Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meetings Table */}
          <Card className="glass-card border-0">
            <CardContent className="p-0 overflow-x-auto">
              {isLoadingMeetings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : meetingsError ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm text-red-600">{meetingsError}</p>
                  <Button variant="outline" onClick={() => fetchMeetings(currentPage, pageSize)}>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Retry
                  </Button>
                </div>
              ) : meetings.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No meetings found.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Officer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Agenda</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {meetings.map((meeting) => (
                      <tr key={meeting.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => toggleSelected(meeting.id)}
                          >
                            {selectedIds.includes(meeting.id) ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                meeting.officer_type === "IAS"
                                  ? "border-orange-500 text-orange-700 dark:text-orange-400"
                                  : "border-blue-500 text-blue-700 dark:text-blue-400"
                              }
                            >
                              {meeting.officer_type}
                            </Badge>
                            <span className="font-medium">{meeting.officer_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">{meeting.designation}</td>
                        <td className="px-4 py-3 align-middle">{meeting.department}</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {meeting.meeting_date}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {meeting.meeting_time}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">{meeting.duration} min</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {meeting.location}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge className={getStatusClasses(meeting.status)}>
                            {meeting.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="truncate block max-w-[200px]">{meeting.agenda}</span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewMeeting(meeting)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingMeeting(meeting)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteType("meeting");
                                setDeleteId(meeting.id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Meetings Pagination */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing {startRecord}-{endRecord} of {totalCount.toLocaleString()} meetings
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingMeetings}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoadingMeetings}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Calendar Header Label Title */}
          {calendarView !== "agenda" && (
            <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-200">{calendarHeaderLabel}</h2>
            </div>
          )}

          {/* Calendar Filters */}
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search events by title, location, officer..."
                    value={calendarSearch}
                    onChange={(e) => setCalendarSearch(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <div className="flex gap-2">
                  <Select value={calendarTypeFilter} onValueChange={(value) => value !== null && setCalendarTypeFilter(value)}>
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue>
                        {calendarTypeFilter === "all" ? "All Types" : (calendarTypeFilter || "Event Type")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={calendarStatusFilter} onValueChange={(value) => value !== null && setCalendarStatusFilter(value)}>
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue>
                        {calendarStatusFilter === "all" ? "All Statuses" : (calendarStatusFilter || "Status")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                      <SelectItem value="Postponed">Postponed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Main Grid and Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Calendar Grid View Content */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="glass-card border-0">
                <CardContent className="p-4">
                  {isLoadingCalendar ? (
                    <div className="py-12 flex justify-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : calendarError ? (
                    <div className="py-12 text-center text-red-500">{calendarError}</div>
                  ) : (
                    <>
                      {/* AGENDA VIEW */}
                      {calendarView === "agenda" && (
                        agendaGrouped.length === 0 ? (
                          <div className="py-12 text-center text-slate-500">No events found.</div>
                        ) : (
                          <div className="space-y-6">
                            {agendaGrouped.map(([date, dayEvents]) => (
                              <div key={date}>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg p-2 text-center min-w-[60px]">
                                    <p className="text-xs font-bold uppercase">
                                      {new Date(date).toLocaleDateString("en-IN", { month: "short" })}
                                    </p>
                                    <p className="text-xl font-bold">
                                      {new Date(date).getDate()}
                                    </p>
                                  </div>
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}
                                    <span className="text-xs text-slate-400 ml-2">({dayEvents.length} events)</span>
                                  </p>
                                </div>

                                <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-[30px]">
                                  {dayEvents.map((event) => (
                                    <div
                                      key={event.id}
                                      className={`relative p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm ${calendarTypeColors[event.event_type] || ""}`}
                                    >
                                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {event.title}
                                              </h3>
                                              <Badge className={`${calendarStatusColors[event.status]} text-[10px] px-1.5`}>
                                                {event.status}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500" onClick={() => setEditingEvent(event)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500"
                                                onClick={() => {
                                                  setDeleteType("event");
                                                  setDeleteId(event.id);
                                                  setDeleteConfirmOpen(true);
                                                }}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {event.start_time} {event.end_time && `- ${event.end_time}`}
                                            </div>
                                            {event.location && (
                                              <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {event.location}
                                              </div>
                                            )}
                                            {event.officer_name && (
                                              <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {event.officer_name}
                                                {event.officer_type && (
                                                  <Badge className="text-[9px] px-1 py-0 h-4 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                    {event.officer_type}
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {event.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                                              {event.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {/* MONTH VIEW */}
                      {calendarView === "month" && (
                        <div className="grid grid-cols-7 gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden p-0.5">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="bg-slate-50 dark:bg-slate-800 text-center py-2 text-xs font-semibold text-slate-500">
                              {d}
                            </div>
                          ))}
                          {monthDays.map((day, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                const parts = day.date.split("-");
                                if (parts.length === 3) {
                                  const [y, m, d] = parts;
                                  setCalendarCurrentDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
                                } else {
                                  setCalendarCurrentDate(new Date(day.date));
                                }
                                setCalendarView("day");
                              }}
                              className={`bg-white dark:bg-slate-900 min-h-[95px] p-2 flex flex-col cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${day.isCurrentMonth ? "" : "opacity-40"}`}
                            >
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{day.dayNum}</span>
                              <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[70px]">
                                {day.events.slice(0, 3).map((e) => (
                                  <div
                                    key={e.id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditingEvent(e);
                                    }}
                                    className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer text-white font-medium ${
                                      e.event_type === "meeting" ? "bg-blue-500" :
                                      e.event_type === "appointment" ? "bg-emerald-500" :
                                      e.event_type === "follow_up" ? "bg-amber-500" :
                                      e.event_type === "training" ? "bg-purple-500" : "bg-red-500"
                                    }`}
                                    title={e.title}
                                  >
                                    {e.title}
                                  </div>
                                ))}
                                {day.events.length > 3 && (
                                  <div className="text-[8px] text-slate-400 font-semibold text-center mt-1">
                                    +{day.events.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* WEEK VIEW */}
                      {calendarView === "week" && (
                        <div className="grid grid-cols-7 gap-2">
                          {weekDays.map((day, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setCalendarCurrentDate(day.date);
                                setCalendarView("day");
                              }}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-3 min-h-[300px] flex flex-col cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                            >
                              <p className="text-xs font-bold text-slate-500 text-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                                {day.label}
                              </p>
                              <div className="space-y-2 flex-1 overflow-y-auto">
                                {day.events.map((e) => (
                                  <div
                                    key={e.id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditingEvent(e);
                                    }}
                                    className={`p-2 rounded-lg text-xs cursor-pointer border-l-4 hover:shadow-sm transition-all ${
                                      e.event_type === "meeting" ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-blue-500" :
                                      e.event_type === "appointment" ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-l-emerald-500" :
                                      e.event_type === "follow_up" ? "bg-amber-50/50 dark:bg-amber-950/20 border-l-amber-500" :
                                      e.event_type === "training" ? "bg-purple-50/50 dark:bg-purple-950/20 border-l-purple-500" :
                                      "bg-red-50/50 dark:bg-red-950/20 border-l-red-500"
                                    }`}
                                  >
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{e.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{e.start_time}</p>
                                  </div>
                                ))}
                                {day.events.length === 0 && (
                                  <p className="text-[10px] text-slate-400 text-center mt-4">No events</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* DAY VIEW */}
                      {calendarView === "day" && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {dayEvents.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => setEditingEvent(e)}
                                className={`p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border hover:shadow-sm cursor-pointer transition-all flex justify-between items-center ${
                                  calendarTypeColors[e.event_type] || ""
                                }`}
                              >
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{e.title}</h4>
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span>{e.start_time} {e.end_time && `- ${e.end_time}`}</span>
                                    {e.location && <span>• {e.location}</span>}
                                  </p>
                                  {e.officer_name && (
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                                      Officer: {e.officer_name} ({e.officer_type})
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={calendarStatusColors[e.status]}>{e.status}</Badge>
                                  <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500" onClick={() => setEditingEvent(e)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500"
                                      onClick={() => {
                                        setDeleteType("event");
                                        setDeleteId(e.id);
                                        setDeleteConfirmOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {dayEvents.length === 0 && (
                              <div className="text-center py-12 text-slate-500 text-sm">
                                No events scheduled for this day.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Events Lists */}
            <div className="space-y-4">
              {/* Today's Events */}
              <Card className="glass-card border-0">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Today&apos;s Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {todayEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No events today.</p>
                    ) : (
                      todayEvents.map((event) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                            <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1"></div>
                          </div>
                          <div className="pb-3">
                            <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{event.title}</p>
                            <p className="text-[10px] text-slate-500">{event.start_time} • {event.location || "No Location"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="glass-card border-0">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Upcoming
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {upcomingEventsList.map((event) => (
                      <div key={event.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 text-xs">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{event.title}</p>
                        <div className="flex justify-between text-slate-500 mt-1">
                          <span>{event.start_date}</span>
                          <span>{event.start_time}</span>
                        </div>
                      </div>
                    ))}
                    {upcomingEventsList.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No upcoming events.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Modals for Meetings */}
      <MeetingDetailModal
        open={!!viewMeeting}
        meeting={viewMeeting}
        onOpenChange={(open) => { if (!open) setViewMeeting(null); }}
        onEdit={() => { if (viewMeeting) { setEditingMeeting(viewMeeting); setViewMeeting(null); } }}
        onStatusChange={async (id, status) => {
          try {
            await updateMeeting(id, { status });
          } catch (err) {
            console.error("Failed to update meeting status:", err);
          }
        }}
      />
      <MeetingFormModal
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        onSubmit={handleAddMeeting}
        isSubmitting={submittingMeeting}
      />
      <MeetingFormModal
        open={!!editingMeeting}
        onOpenChange={(open) => { if (!open) setEditingMeeting(null); }}
        meeting={editingMeeting}
        onSubmit={handleEditMeeting}
        isSubmitting={submittingMeeting}
      />

      {/* Modals for Calendar Events */}
      <EventFormModal
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        onSubmit={handleAddEvent}
        isSubmitting={submittingEvent}
      />
      <EventFormModal
        open={!!editingEvent}
        onOpenChange={(open) => { if (!open) setEditingEvent(null); }}
        event={editingEvent}
        onSubmit={handleEditEvent}
        isSubmitting={submittingEvent}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white font-semibold">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {deleteType === "bulk_meetings"
                ? `Are you sure you want to permanently delete these ${selectedIds.length} selected meetings? This action cannot be undone.`
                : deleteType === "event"
                ? "Are you sure you want to permanently delete this calendar event? This action cannot be undone."
                : "Are you sure you want to permanently delete this meeting? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setDeleteConfirmOpen(false);
                if (deleteType === "bulk_meetings") {
                  await bulkDelete(selectedIds);
                  clearSelection();
                } else if (deleteType === "event" && deleteId) {
                  await deleteEvent(deleteId);
                } else if (deleteType === "meeting" && deleteId) {
                  await deleteMeeting(deleteId);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }>
        <MeetingsHubContent />
      </Suspense>
    </DashboardLayout>
  );
}
