// "use client";

// import { useState, useMemo } from "react";
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
// import { useActivityLogStore } from "@/store/database-store";
// import type { ActivityLog } from "@/types";
// import { Download, RefreshCcw } from "lucide-react";

// const actionColors: Record<string, string> = {
//   created: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
//   updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
//   deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
//   login: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
//   logout: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
// };

// export default function ActivityLogPage() {
//   const logs = useActivityLogStore((s) => s.logs);
//   const [searchInput, setSearchInput] = useState("");
//   const [actionFilter, setActionFilter] = useState("all");
//   const [resourceFilter, setResourceFilter] = useState("all");
//   const [view, setView] = useState<"timeline" | "table">("timeline");

//   const [debouncedSearch] = useDebounce(searchInput, 300);

//   const filteredLogs = useMemo(() => {
//     let data = logs;
//     const q = debouncedSearch.toLowerCase();
//     if (q) {
//       data = data.filter(
//         (l) =>
//           l.user_name.toLowerCase().includes(q) ||
//           l.details.toLowerCase().includes(q) ||
//           l.resource_type.toLowerCase().includes(q)
//       );
//     }
//     if (actionFilter !== "all") data = data.filter((l) => l.action === actionFilter);
//     if (resourceFilter !== "all") data = data.filter((l) => l.resource_type === resourceFilter);
//     return data;
//   }, [logs, debouncedSearch, actionFilter, resourceFilter]);

//   const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);
//   const resources = useMemo(() => Array.from(new Set(logs.map((l) => l.resource_type))).sort(), [logs]);

//   const handleExport = (type: "pdf" | "excel") => alert(`Exporting ${filteredLogs.length} logs to ${type.toUpperCase()}...`);

//   const clearFilters = () => {
//     setSearchInput("");
//     setActionFilter("all");
//     setResourceFilter("all");
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4">
//         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
//             <p className="text-sm text-slate-500 dark:text-slate-400">{filteredLogs.length} activities</p>
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
//                 <Input placeholder="Search by user, action, details..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
//               </div>
//               <div className="flex gap-2 overflow-x-auto">
//                 <Select value={actionFilter} onValueChange={(value) => setActionFilter(value || "all")}>
//                   <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Action" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Actions</SelectItem>
//                     {actions.map((action) => <SelectItem key={action} value={action}>{action}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//                 <Select value={resourceFilter} onValueChange={(value) => setResourceFilter(value || "all")}>
//                   <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Resource" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Resources</SelectItem>
//                     {resources.map((resource) => <SelectItem key={resource} value={resource}>{resource}</SelectItem>)}
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
//                       <div className="flex items-center gap-2 mb-1">
//                         <p className="font-semibold text-slate-900 dark:text-white text-sm">{log.user_name}</p>
//                         <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>{log.action}</Badge>
//                       </div>
//                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{log.details}</p>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
//                         <div>
//                           <span className="text-slate-400">Resource: </span>
//                           <span className="text-slate-700 dark:text-slate-300">{log.resource_type}</span>
//                         </div>
//                         <div>
//                           <span className="text-slate-400">IP: </span>
//                           <span className="text-slate-700 dark:text-slate-300">{log.ip_address}</span>
//                         </div>
//                         <div>
//                           <span className="text-slate-400">Time: </span>
//                           <span className="text-slate-700 dark:text-slate-300">{new Date(log.timestamp).toLocaleString()}</span>
//                         </div>
//                         <div>
//                           <span className="text-slate-400">Agent: </span>
//                           <span className="text-slate-700 dark:text-slate-300">{log.user_agent}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <Card className="glass-card border-0">
//             <CardContent className="overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead className="bg-slate-50/80 dark:bg-slate-800/60">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">User</th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Action</th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Resource</th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Details</th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">Time</th>
//                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300">IP</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
//                   {filteredLogs.map((log) => (
//                     <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
//                       <td className="px-4 py-3 align-middle font-medium text-slate-900 dark:text-white">{log.user_name}</td>
//                       <td className="px-4 py-3 align-middle"><Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>{log.action}</Badge></td>
//                       <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.resource_type}</td>
//                       <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.details}</td>
//                       <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
//                       <td className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">{log.ip_address}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
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
import { useActivityLogsStore } from "@/store/activity-logs-store";
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
  User,
  Globe,
  Monitor,
  Calendar,
  FileText,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash,
} from "lucide-react";
import type { ActivityLog } from "@/types";
import pb from "@/lib/pocketbase";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";

export default function ActivityLogPage() {
  const logs = useActivityLogsStore((s) => s.logs);
  const isLoading = useActivityLogsStore((s) => s.isLoading);
  const error = useActivityLogsStore((s) => s.error);
  const totalCount = useActivityLogsStore((s) => s.totalCount);
  const fetchLogs = useActivityLogsStore((s) => s.fetchLogs);
  const deleteLog = useActivityLogsStore((s) => s.deleteLog);

  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");

  const [debouncedSearch] = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchLogs({
      action: actionFilter,
      resourceType: resourceFilter,
      search: debouncedSearch || undefined,
    });
  }, [debouncedSearch, actionFilter, resourceFilter, fetchLogs]);

  const filteredLogs = useMemo(() => {
    let data = logs;
    const q = debouncedSearch.toLowerCase();
    if (q) {
      data = data.filter(
        (l) =>
          l.user_name.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.resource_type.toLowerCase().includes(q)
      );
    }
    if (actionFilter !== "all") {
      data = data.filter((l) => l.action === actionFilter);
    }
    if (resourceFilter !== "all") {
      data = data.filter((l) => l.resource_type === resourceFilter);
    }
    return data;
  }, [logs, debouncedSearch, actionFilter, resourceFilter]);

  const getActionClasses = (action: string) => {
    switch (action) {
      case "created":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "updated":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "deleted":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "login":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "logout":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-3 w-3" />;
      case "updated":
        return <Edit className="h-3 w-3" />;
      case "deleted":
        return <Trash className="h-3 w-3" />;
      case "login":
        return <LogIn className="h-3 w-3" />;
      case "logout":
        return <LogOut className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "meeting":
        return <Calendar className="h-3 w-3 text-blue-500" />;
      case "officer":
        return <User className="h-3 w-3 text-emerald-500" />;
      case "user":
        return <User className="h-3 w-3 text-purple-500" />;
      case "report":
        return <FileText className="h-3 w-3 text-amber-500" />;
      default:
        return <FileText className="h-3 w-3 text-slate-500" />;
    }
  };

  const getBrowserName = (userAgent: string) => {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  };

  const handleExport = (type: "excel" | "pdf") => {
    try {
      const headers = [
        "User Name",
        "Action",
        "Resource Type",
        "Resource ID",
        "Details",
        "IP Address",
        "User Agent",
        "Timestamp"
      ];

      const rows = filteredLogs.map((l) => [
        l.user_name || "",
        l.action || "",
        l.resource_type || "",
        l.resource_id || "",
        l.details || "",
        l.ip_address || "",
        l.user_agent || "",
        l.timestamp ? new Date(l.timestamp).toLocaleString() : ""
      ]);

      const filename = `activity_logs_${new Date().toISOString().slice(0, 10)}`;
      if (type === "excel") {
        exportToCSV(`${filename}.csv`, headers, rows);
      } else {
        exportToPDF(`${filename}.pdf`, "Activity Logs", headers, rows, {
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
    setActionFilter("all");
    setResourceFilter("all");
  };

  const actions = useMemo(() => {
    const acts = new Set(logs.map((l) => l.action).filter(Boolean));
    return Array.from(acts).sort();
  }, [logs]);

  const resourceTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.resource_type).filter(Boolean));
    return Array.from(types).sort();
  }, [logs]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalCount} activit{totalCount !== 1 ? "ies" : "y"}
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
                  placeholder="Search by user, action, details..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={actionFilter} onValueChange={(value) => setActionFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {actionFilter === "all" ? "All Actions" : (actionFilter.charAt(0).toUpperCase() + actionFilter.slice(1))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={resourceFilter} onValueChange={(value) => setResourceFilter(value || "all")}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue>
                      {resourceFilter === "all" ? "All Resources" : (resourceFilter.charAt(0).toUpperCase() + resourceFilter.slice(1))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
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
            <div className="py-12 text-center text-sm text-slate-500">No activity logs found.</div>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="glass-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {log.user_name}
                        </span>
                        <Badge className={`${getActionClasses(log.action)} flex items-center gap-1`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {log.details}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          {getResourceIcon(log.resource_type)}
                          <span className="text-slate-500">Resource:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {log.resource_type}
                          </span>
                          {log.resource_id && (
                            <span className="text-slate-400 font-mono">
                              ({log.resource_id})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-500">IP:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                            {log.ip_address || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-500">Agent:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {getBrowserName(log.user_agent)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-500">Time:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
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
