// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { useDebounce } from "use-debounce";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { useUpdateLogsStore } from "@/store/database-store";
// import type { UpdateLog } from "@/types";
// import { Download, RefreshCcw } from "lucide-react";

// const priorityClasses: Record<string, string> = {
//   High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
//   Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
//   Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
// };

// export default function UpdatesLogPage() {
//   const logs = useUpdateLogsStore((s) => s.logs);
//   const totalCount = useUpdateLogsStore((s) => s.totalCount);
//   const currentPage = useUpdateLogsStore((s) => s.currentPage);
//   const pageSize = useUpdateLogsStore((s) => s.pageSize);
//   const fetchLogsApi = useUpdateLogsStore((s) => s.fetchLogs);
//   const addLog = useUpdateLogsStore((s) => s.addLog);

//   const [searchInput, setSearchInput] = useState("");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [priorityFilter, setPriorityFilter] = useState("all");
//   const [view, setView] = useState<"timeline" | "table">("timeline");

//   const [debouncedSearch] = useDebounce(searchInput, 300);

//   useEffect(() => {
//     fetchLogsApi(1, pageSize || 20);
//   }, [debouncedSearch, typeFilter, priorityFilter, fetchLogsApi, pageSize]);

//   const filteredLogs = useMemo(() => {
//     let data = logs;
//     const q = debouncedSearch.toLowerCase();
//     if (q) {
//       data = data.filter((l) => l.officer_name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.update_type.toLowerCase().includes(q) || l.meeting_id.toLowerCase().includes(q));
//     }
//     if (typeFilter !== "all") data = data.filter((l) => l.update_type === typeFilter);
//     if (priorityFilter !== "all") data = data.filter((l) => l.priority === priorityFilter);
//     return data;
//   }, [logs, debouncedSearch, typeFilter, priorityFilter]);

//   const updateTypes = useMemo(() => Array.from(new Set(logs.map((l) => l.update_type))).sort(), [logs]);

//   const handleExport = (type: "pdf" | "excel") => alert(`Exporting ${totalCount} logs to ${type.toUpperCase()}...`);

//   const clearFilters = () => {
//     setSearchInput("");
//     setTypeFilter("all");
//     setPriorityFilter("all");
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4">
//         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Updates Log</h1>
//             <p className="text-sm text-slate-500 dark:text-slate-400">{totalCount} updates</p>
//           </div>
//           <div className="flex flex-wrap items-center gap-2">
//             <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
//               {(["timeline", "table"] as const).map((v) => (
//                 <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${view === v ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-600 dark:text-slate-300"}`}>
//                   {v}
//                 </button>
//               ))}
//             </div>
//             <Button variant="outline" onClick={() => handleExport("excel")}>
//               <Download className="h-4 w-4 mr-2" /> Excel
//             </Button>
//             <Button variant="outline" onClick={() => handleExport("pdf")}>
//               <Download className="h-4 w-4 mr-2" /> PDF
//             </Button>
//           </div>
//         </div>

//         <Card className="glass-card border-0">
//           <CardContent className="p-4">
//             <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
//               <div className="relative flex-1">
//                 <Input placeholder="Search by officer name, type, description..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
//               </div>
//               <div className="flex gap-2 overflow-x-auto">
//                 <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "all")}>
//                   <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="Update type" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Types</SelectItem>
//                     {updateTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//                 <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value || "all")}>
//                   <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Priorities</SelectItem>
//                     <SelectItem value="High">High</SelectItem>
//                     <SelectItem value="Medium">Medium</SelectItem>
//                     <SelectItem value="Low">Low</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 <Button variant="ghost" onClick={clearFilters}>Clear</Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {view === "timeline" ? (
//           <div className="space-y-4">
//             {filteredLogs.map((log) => (
//               <Card key={log.id} className="glass-card border-0">
//                 <CardContent className="p-5">
//                   <div className="flex items-start gap-4">
//                     <div className="w-3 h-3 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
//                     <div className="flex-1">
//                        <div className="flex items-center gap-2 mb-1">
//                          <span className="text-xs text-slate-400">Update #{log.id}</span>
//                          <span className="text-xs text-slate-400">Meeting #{log.meeting_id}</span>
//                          <Badge className={priorityClasses[log.priority]}>{log.priority}</Badge>
//                        </div>
//                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{log.update_type}</p>
//                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{log.description}</p>
//                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
//                          <div>
//                            <span className="text-slate-400">Previous: </span>
//                            <span className="text-slate-700 dark:text-slate-300">{log.previous_value}</span>
//                          </div>
//                          <div>
//                            <span className="text-slate-400">New: </span>
//                            <span className="text-slate-700 dark:text-slate-300">{log.new_value}</span>
//                          </div>
//                          <div>
//                            <span className="text-slate-400">Attachments: </span>
//                            <span className="text-slate-700 dark:text-slate-300">{log.attachments.length ? `${log.attachments.length} file(s)` : "—"}</span>
//                          </div>
//                          <div>
//                            <span className="text-slate-400">Updated By: </span>
//                            <span className="text-slate-700 dark:text-slate-300">{log.updated_by}</span>
//                          </div>
//                          <div>
//                            <span className="text-slate-400">Completed At: </span>
//                            <span className="text-slate-700 dark:text-slate-300">{new Date(log.completed_at).toLocaleString()}</span>
//                          </div>
//                        </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <Card className="glass-card border-0">
//             <CardContent className="overflow-x-auto">
//                <table className="min-w-full text-sm">
//                  <thead className="bg-slate-50/80 dark:bg-slate-800/60">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Update ID</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Meeting ID</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Officer Name</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Update Type</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Description</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Previous Value</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">New Value</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Attachments</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Priority</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Updated By</th>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Completed At</th>
//                     </tr>
//                  </thead>
//                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
//                    {filteredLogs.map((log) => (
//                       <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
//                         <td className="px-4 py-3 align-middle font-medium text-slate-900 dark:text-white">#{log.id}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">#{log.meeting_id}</td>
//                         <td className="px-4 py-3 align-middle font-medium text-slate-900 dark:text-white">{log.officer_name}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
//                           <Badge className="border-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">{log.update_type}</Badge>
//                         </td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.description}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.previous_value}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.new_value}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.attachments.length ? `${log.attachments.length} file(s)` : "—"}</td>
//                         <td className="px-4 py-3 align-middle"><Badge className={priorityClasses[log.priority]}>{log.priority}</Badge></td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.updated_by}</td>
//                         <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{new Date(log.completed_at).toLocaleString()}</td>
//                       </tr>
//                    ))}
//                  </tbody>
//                </table>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }


"use client";

import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { useUpdateLogsStore } from "@/store/update-logs-store";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
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
  Download,
  Trash2,
  Loader2,
  RefreshCcw,
  Search,
  FileText,
  Paperclip,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { UpdateLog } from "@/types";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";

export default function UpdatesLogPage() {
  const logs = useUpdateLogsStore((s) => s.logs);
  const isLoading = useUpdateLogsStore((s) => s.isLoading);
  const error = useUpdateLogsStore((s) => s.error);
  const totalCount = useUpdateLogsStore((s) => s.totalCount);
  const fetchLogs = useUpdateLogsStore((s) => s.fetchLogs);
  const deleteLog = useUpdateLogsStore((s) => s.deleteLog);

  const [searchInput, setSearchInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [debouncedSearch] = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchLogs({
      priority: priorityFilter,
      updateType: typeFilter,
      search: debouncedSearch || undefined,
    });
  }, [debouncedSearch, priorityFilter, typeFilter, fetchLogs]);

  const filteredLogs = useMemo(() => {
    let data = logs;
    const q = debouncedSearch.toLowerCase();
    if (q) {
      data = data.filter(
        (l) =>
          l.officer_name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.update_type.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== "all") {
      data = data.filter((l) => l.priority === priorityFilter);
    }
    if (typeFilter !== "all") {
      data = data.filter((l) => l.update_type === typeFilter);
    }
    return data;
  }, [logs, debouncedSearch, priorityFilter, typeFilter]);

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Low":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case "Meeting Completed":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "Officer Transferred":
        return <User className="h-4 w-4 text-purple-500" />;
      case "New Appointment":
        return <User className="h-4 w-4 text-emerald-500" />;
      case "Department Change":
        return <FileText className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleExport = (type: "excel" | "pdf") => {
    try {
      const headers = [
        "Officer Name",
        "Update Type",
        "Priority",
        "Description",
        "Previous Value",
        "New Value",
        "Updated By",
        "Completed At"
      ];

      const rows = filteredLogs.map((l) => [
        l.officer_name || "",
        l.update_type || "",
        l.priority || "",
        l.description || "",
        l.previous_value || "",
        l.new_value || "",
        l.updated_by || "",
        l.completed_at ? new Date(l.completed_at).toLocaleString() : ""
      ]);

      const filename = `updates_log_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "Updates Log", headers, rows, {
          orientation: "landscape",
        });
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setPriorityFilter("all");
    setTypeFilter("all");
  };

  const updateTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.update_type).filter(Boolean));
    return Array.from(types).sort();
  }, [logs]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Updates Log</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalCount} update{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by officer name, type, description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "all")}>
                  <SelectTrigger className="min-w-[160px]">
                    <SelectValue>
                      {typeFilter === "all" ? "All Types" : (typeFilter || "Update Type")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {updateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {priorityFilter === "all" ? "All Priorities" : (priorityFilter || "Priority")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={clearFilters}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" onClick={() => fetchLogs()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No update logs found.</div>
          ) : (
            filteredLogs.map((log, index) => (
              <Card key={log.id} className="glass-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-slate-500">
                          Update #{index + 1}
                        </span>
                        {log.meeting_id && (
                          <span className="text-xs text-slate-500">
                            Meeting #{log.meeting_id}
                          </span>
                        )}
                        <Badge className={getPriorityClasses(log.priority)}>
                          {log.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {getUpdateTypeIcon(log.update_type)}
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {log.update_type}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {log.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Previous Status:</span>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {log.previous_value || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">New Status:</span>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {log.new_value || "N/A"}
                          </p>
                        </div>
                        {log.attachments && log.attachments.length > 0 && (
                          <div>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Paperclip className="h-3 w-3" /> Attachments:
                            </span>
                            <p className="font-medium text-slate-700 dark:text-slate-300">
                              {log.attachments.length} file(s)
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500 flex items-center gap-1">
                            <User className="h-3 w-3" /> Updated By:
                          </span>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {log.updated_by || "System"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Completed At: {new Date(log.completed_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLog(log.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}