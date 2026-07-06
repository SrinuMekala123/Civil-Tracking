"use client";

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
import type { Meeting } from "@/types";
import { Pencil, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface MeetingDetailModalProps {
  open: boolean;
  meeting: Meeting | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onStatusChange: (id: string, status: Meeting["status"]) => void;
}

export function MeetingDetailModal({ open, meeting, onOpenChange, onEdit, onStatusChange }: MeetingDetailModalProps) {
  if (!meeting) return null;

  const statusClasses =
    meeting.status === "Scheduled"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : meeting.status === "Completed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : meeting.status === "Cancelled"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl p-0 gap-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <SheetTitle>Meeting Details</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={meeting.officer_type === "IAS" ? "border-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}>
              {meeting.officer_type}
            </Badge>
            <span className="font-semibold text-slate-900 dark:text-white">{meeting.officer_name}</span>
            <span className="text-slate-500">| {meeting.designation}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Meeting ID</p>
              <p className="font-medium text-slate-900 dark:text-white">#{meeting.id}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Department</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.department}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Date & Time</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.meeting_date} at {meeting.meeting_time}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Duration</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.duration} minutes</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Location</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.location}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <Badge className={statusClasses}>{meeting.status}</Badge>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Created By</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.created_by}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Follow-up Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{meeting.follow_up_date || "Not set"}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-slate-500 text-xs mb-1">Agenda</p>
            <p className="text-sm text-slate-900 dark:text-white">{meeting.agenda}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Attendees</p>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((attendee) => (
                <Badge key={attendee} className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{attendee}</Badge>
              ))}
            </div>
          </div>
          {meeting.notes && (
            <div>
              <p className="text-slate-500 text-xs mb-1">Notes/Minutes</p>
              <p className="text-sm text-slate-900 dark:text-white">{meeting.notes}</p>
            </div>
          )}
          {meeting.documents.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-1">Documents</p>
              <div className="space-y-2">
                {meeting.documents.map((doc, idx) => (
                  <a key={idx} href={doc} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                    <ExternalLink className="h-4 w-4" /> {doc.split("/").pop()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <SheetFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={() => { onStatusChange(meeting.id, "Completed"); onOpenChange(false); }}>
            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Complete
          </Button>
          <Button variant="outline" onClick={() => { onStatusChange(meeting.id, "Cancelled"); onOpenChange(false); }}>
            <XCircle className="h-4 w-4 mr-2 text-red-600" /> Cancel
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Meeting
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
