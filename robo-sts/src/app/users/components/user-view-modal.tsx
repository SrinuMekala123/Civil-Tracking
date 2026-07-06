import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { User, ActivityLog } from "@/types";
import { Pencil, Phone, Mail, Loader2, Calendar, ShieldAlert } from "lucide-react";
import pb from "@/lib/pocketbase";

interface UserViewModalProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const getActionClasses = (action: string) => {
  const norm = action.toLowerCase();
  if (norm.includes("register") || norm.includes("create") || norm.includes("add") || norm.includes("appoint")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30";
  }
  if (norm.includes("update") || norm.includes("edit") || norm.includes("transfer") || norm.includes("change") || norm.includes("schedule")) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30";
  }
  if (norm.includes("delete") || norm.includes("remove") || norm.includes("cancel") || norm.includes("suspend")) {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30";
  }
  if (norm.includes("login")) {
    return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30";
  }
  if (norm.includes("logout")) {
    return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/30";
  }
  return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30";
};

export function UserViewModal({ open, user, onOpenChange, onEdit }: UserViewModalProps) {
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLogsLoading(true);
      // Retrieve logs where the current user name or id is registered as actor
      pb.collection("activity_logs")
        .getFullList({
          filter: `user_id = "${user.id}" || user_name = "${user.name}" || user_name = "${user.email}"`,
          sort: "-timestamp",
        })
        .then((records) => {
          const mapped = records.map((record) => ({
            id: record.id,
            user_id: record.user_id || "",
            user_name: record.user_name || "Unknown",
            action: record.action || "",
            resource_type: record.resource_type || "",
            resource_id: record.resource_id || "",
            details: record.details || "",
            ip_address: record.ip_address || "",
            user_agent: record.user_agent || "",
            timestamp: record.timestamp || record.created,
          }));
          setUserLogs(mapped);
        })
        .catch((err) => {
          console.error("Failed to fetch user activity logs:", err);
        })
        .finally(() => {
          setLogsLoading(false);
        });
    }
  }, [open, user]);

  if (!user) return null;

  const statusClasses =
    user.status === "Active"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : user.status === "Inactive"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl p-0 gap-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <SheetTitle>User Details</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <Badge className={statusClasses}>{user.status}</Badge>
            <span className="text-xs text-slate-500">Last login: {new Date(user.last_login).toLocaleString()}</span>
          </div>
          <Separator />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Name</p>
              <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Role</p>
              <p className="font-medium text-slate-900 dark:text-white">{user.role}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Department</p>
              <p className="font-medium text-slate-900 dark:text-white">{user.department}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Phone</p>
              <p className="font-medium text-slate-900 dark:text-white">{user.phone}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Created</p>
              <p className="font-medium text-slate-900 dark:text-white">{new Date(user.created).toLocaleString()}</p>
            </div>
          </div>
          <Separator />
          
          <div>
            <p className="text-slate-500 text-xs mb-1.5 font-medium">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {user.permissions.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No custom permissions assigned.</span>
              ) : (
                user.permissions.map((perm) => (
                  <Badge key={perm} className="border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{perm}</Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-xs font-medium">Recent Activity History</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-medium">
                {userLogs.length} actions
              </span>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : userLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 text-center">
                <ShieldAlert className="h-6 w-6 text-slate-400 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No recorded logs found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">This user hasn't performed any monitored actions yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 relative before:absolute before:inset-y-1 before:left-2.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {userLogs.map((log) => (
                  <div key={log.id} className="relative pl-6 group">
                    <div className="absolute left-[7px] top-[7px] w-2 h-2 rounded-full bg-indigo-500 border border-white dark:border-slate-900 group-hover:scale-125 transition-transform duration-200" />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 ${getActionClasses(log.action)}`}>
                            {log.action}
                          </Badge>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono uppercase">
                            {log.resource_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 pr-4 leading-relaxed font-medium">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-50 dark:bg-slate-900/50 px-1 py-0.2 rounded">IP: {log.ip_address}</span>
                        <span className="truncate max-w-[280px]" title={log.user_agent}>
                          {log.user_agent}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit User
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

