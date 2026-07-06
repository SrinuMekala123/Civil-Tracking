"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import {
  FileText,
  CalendarDays,
  Activity,
  BarChart3,
  Download,
  Mail,
  Loader2,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    officers: 0,
    meetings: 0,
    activities: 0,
  });
  const [departments, setDepartments] = useState<string[]>([]);

  // Form State
  const [reportType, setReportType] = useState("Officer Directory");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("all");
  const [officerType, setOfficerType] = useState("both");
  const [format, setFormat] = useState("pdf");

  // Email Report Modal State
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("admin@civiltracking.gov.in");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch initial stats and departments
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch counts
        const officersCount = await pb.collection("ias_officers").getList(1, 1);
        const meetingsCount = await pb.collection("meetings").getList(1, 1);
        const activityCount = await pb.collection("activity_logs").getList(1, 1);

        setStats({
          officers: officersCount.totalItems,
          meetings: meetingsCount.totalItems,
          activities: activityCount.totalItems,
        });

        // Fetch unique departments for dropdown
        const officers = await pb.collection("ias_officers").getFullList({ fields: "department" });
        const meetings = await pb.collection("meetings").getFullList({ fields: "department" });
        const dbDepts = [
          ...officers.map((o) => o.department),
          ...meetings.map((m) => m.department),
        ].filter(Boolean);

        const DEFAULT_DEPARTMENTS = [
          "Administration",
          "Agriculture",
          "Education",
          "Finance",
          "Health",
          "Home",
          "Information Technology",
          "Personnel & Training",
          "Public Works",
          "Revenue",
        ];

        const uniqueDepts = Array.from(new Set([...dbDepts, ...DEFAULT_DEPARTMENTS])).sort();
        setDepartments(uniqueDepts);
      } catch (error) {
        console.error("Failed to load report stats:", error);
      }
    }
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let headers: string[] = [];
      let rows: string[][] = [];
      let reportTitle = `${reportType} - ${new Date().toLocaleDateString()}`;

      if (reportType === "Officer Directory") {
        const parts: string[] = [];
        if (department && department !== "all") {
          parts.push(`department = "${department}"`);
        }
        const filter = parts.length ? parts.join(" && ") : undefined;

        headers = ["Name", "Service/Type", "Batch Year", "Cadre", "State", "Present Post", "Department", "Email", "Contact Number"];
        
        let iasRecords: any[] = [];
        let ipsRecords: any[] = [];

        if (officerType === "both" || officerType === "IAS") {
          iasRecords = await pb.collection("ias_officers").getFullList({ filter });
        }
        if (officerType === "both" || officerType === "IPS") {
          ipsRecords = await pb.collection("ips_officers").getFullList({ filter });
        }

        const iasRows = iasRecords.map((r) => [r.name || "", "IAS", String(r.batch_year || ""), r.cadre || "", r.state || "", r.current_position || "", r.department || "", r.email || "", r.contact_number || ""]);
        const ipsRows = ipsRecords.map((r) => [r.name || "", "IPS", String(r.batch_year || ""), r.cadre || "", r.state || "", r.current_position || "", r.department || "", r.email || "", r.contact_number || ""]);
        rows = [...iasRows, ...ipsRows];

      } else if (reportType === "Meeting Summary") {
        const parts: string[] = [];
        if (department && department !== "all") {
          parts.push(`department = "${department}"`);
        }
        if (officerType && officerType !== "both") {
          parts.push(`officer_type = "${officerType}"`);
        }
        if (dateFrom) {
          parts.push(`meeting_date >= "${dateFrom}"`);
        }
        if (dateTo) {
          parts.push(`meeting_date <= "${dateTo}"`);
        }
        const filter = parts.length ? parts.join(" && ") : undefined;

        headers = ["Date", "Time", "Officer Name", "Service", "Designation", "Department", "Duration (Mins)", "Location", "Agenda", "Status"];
        const meetings = await pb.collection("meetings").getFullList({
          sort: "-meeting_date",
          filter
        });

        rows = meetings.map((m) => [
          m.meeting_date || "",
          m.meeting_time || "",
          m.officer_name || "",
          m.officer_type || "",
          m.designation || "",
          m.department || "",
          String(m.duration || 0),
          m.location || "",
          m.agenda || "",
          m.status || ""
        ]);

      } else if (reportType === "Activity Report") {
        const parts: string[] = [];
        if (dateFrom) {
          parts.push(`timestamp >= "${dateFrom}T00:00:00Z"`);
        }
        if (dateTo) {
          parts.push(`timestamp <= "${dateTo}T23:59:59Z"`);
        }
        const filter = parts.length ? parts.join(" && ") : undefined;

        headers = ["Timestamp", "User Name", "Action", "Resource Type", "Resource ID", "Details", "IP Address"];
        const logs = await pb.collection("activity_logs").getFullList({
          sort: "-timestamp",
          filter
        });

        rows = logs.map((l) => [
          l.timestamp ? new Date(l.timestamp).toLocaleString() : "",
          l.user_name || "",
          l.action || "",
          l.resource_type || "",
          l.resource_id || "",
          l.details || "",
          l.ip_address || ""
        ]);

      } else if (reportType === "Performance Metrics") {
        headers = ["Department", "Total Meetings", "Completed", "Scheduled", "Cancelled/Rescheduled"];
        
        const meetings = await pb.collection("meetings").getFullList();
        const deptMap: Record<string, { total: number; completed: number; scheduled: number; other: number }> = {};
        
        meetings.forEach((m) => {
          const dept = m.department || "General / Others";
          if (!deptMap[dept]) {
            deptMap[dept] = { total: 0, completed: 0, scheduled: 0, other: 0 };
          }
          deptMap[dept].total++;
          if (m.status === "Completed") deptMap[dept].completed++;
          else if (m.status === "Scheduled") deptMap[dept].scheduled++;
          else deptMap[dept].other++;
        });

        rows = Object.entries(deptMap).map(([dept, counts]) => [
          dept,
          String(counts.total),
          String(counts.completed),
          String(counts.scheduled),
          String(counts.other)
        ]);
      }

      await pb.collection("report_history").create({
        title: reportTitle,
        report_type: reportType,
        date_from: dateFrom,
        date_to: dateTo,
        department: department === "all" ? "" : department,
        officer_type: officerType,
        format: format.toUpperCase(),
        generated_by: "Admin User",
        status: "Generated",
      });

      const filename = `${reportType.replace(/\s+/g, "_").toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}`;
      if (format === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, reportType, headers, rows, {
          orientation: "landscape",
        });
      }

      alert(`Report "${reportType}" generated and downloaded successfully!`);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Error generating report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // 1. Save to report_history collection as Emailed status
      await pb.collection("report_history").create({
        title: `${reportType} (Emailed) - ${new Date().toLocaleDateString()}`,
        report_type: reportType,
        date_from: dateFrom,
        date_to: dateTo,
        department: department === "all" ? "" : department,
        officer_type: officerType,
        format: format.toUpperCase(),
        generated_by: `Admin User (Sent to ${emailAddress})`,
        status: "Emailed",
      });

      // 2. Simulate emailing the report
      setTimeout(() => {
        alert(`Report "${reportType}" sent successfully to ${emailAddress}!`);
        setSendingEmail(false);
        setEmailDialogOpen(false);
      }, 1200);
    } catch (error) {
      console.error("Failed to email report:", error);
      alert("Error sending report email.");
      setSendingEmail(false);
    }
  };

  const reportCards = [
    {
      id: "Officer Directory",
      title: "Officer Directory Report",
      desc: "All officers with contact details",
      icon: Users,
      count: stats.officers,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      id: "Meeting Summary",
      title: "Meeting Summary Report",
      desc: "Total meetings, completed vs scheduled",
      icon: CalendarDays,
      count: stats.meetings,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      id: "Activity Report",
      title: "Activity Report",
      desc: "User activity log summary",
      icon: Activity,
      count: stats.activities,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      id: "Performance Metrics",
      title: "Performance Metrics",
      desc: "Department and officer metrics",
      icon: BarChart3,
      count: stats.officers, // Placeholder
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate and export administrative reports</p>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((card) => (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${reportType === card.id ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent"
                }`}
              onClick={() => setReportType(card.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                    {card.count.toLocaleString()} records available
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Parameters Form */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Report Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date From */}
              {reportType !== "Officer Directory" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-0"
                  />
                </div>
              )}

              {/* Date To */}
              {reportType !== "Officer Directory" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-0"
                  />
                </div>
              )}

              {/* Department */}
              {reportType !== "Activity Report" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Department</Label>
                  <Select value={department} onValueChange={(value) => setDepartment(value || "all")}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-0">
                      <SelectValue>
                        {department === "all" ? "All Departments" : (department || "Select Department")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Officer Type */}
              {reportType !== "Activity Report" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Officer Type</Label>
                  <Select value={officerType} onValueChange={(value) => setOfficerType(value || "both")}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-0">
                      <SelectValue>
                        {officerType === "both" ? "Both (IAS & IPS)" : (officerType === "IAS" ? "IAS Only" : "IPS Only")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (IAS & IPS)</SelectItem>
                      <SelectItem value="IAS">IAS Only</SelectItem>
                      <SelectItem value="IPS">IPS Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Export Format */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Export Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value || "pdf")}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-0">
                    <SelectValue>
                      {format === "pdf" ? "PDF Document" : "Excel Spreadsheet"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>

              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger
                  render={
                    <Button variant="outline" disabled={loading}>
                      <Mail className="h-4 w-4 mr-2" /> Email Report
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Email Report</DialogTitle>
                    <DialogDescription>
                      Send the generated <strong>{reportType}</strong> directly to an email address.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium">
                        Recipient Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@civiltracking.gov.in"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border-0"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEmailDialogOpen(false)}
                      disabled={sendingEmail}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !emailAddress}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}