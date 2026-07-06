"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { Meeting } from "@/types";
import pb from "@/lib/pocketbase";

const meetingSchema = z.object({
  officer_id: z.string().optional(),
  officer_name: z.string().min(1, "Officer name is required"),
  officer_type: z.enum(["IAS", "IPS"]),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  meeting_date: z.string().min(1, "Meeting date is required"),
  meeting_time: z.string().min(1, "Meeting time is required"),
  duration: z.number().min(1, "Duration is required"),
  location: z.string().min(1, "Location is required"),
  agenda: z.string().min(1, "Agenda is required"),
  status: z.enum(["Scheduled", "Completed", "Cancelled", "Rescheduled"]),
  attendees: z.string().optional(),
  notes: z.string().optional(),
  documents: z.string().optional(),
  created_by: z.string().optional(),
  follow_up_date: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  onSubmit: (values: MeetingFormValues) => void;
  isSubmitting?: boolean;
}

export function MeetingFormModal({ open, onOpenChange, meeting, onSubmit, isSubmitting = false }: MeetingFormModalProps) {
  const [iasOfficers, setIasOfficers] = useState<any[]>([]);
  const [ipsOfficers, setIpsOfficers] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  const { register, handleSubmit, reset, formState, setValue, watch } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      officer_id: "",
      officer_name: "",
      officer_type: "IAS",
      designation: "",
      department: "",
      meeting_date: "",
      meeting_time: "",
      duration: 60,
      location: "",
      agenda: "",
      status: "Scheduled",
      attendees: "",
      notes: "",
      documents: "",
      created_by: "Admin",
      follow_up_date: "",
    },
  });

  const selectedOfficerType = watch("officer_type");

  useEffect(() => {
    if (open) {
      setLoadingOfficers(true);
      Promise.all([
        pb.collection("ias_officers").getFullList({ sort: "name" }).catch(() => []),
        pb.collection("ips_officers").getFullList({ sort: "name" }).catch(() => []),
      ]).then(([ias, ips]) => {
        setIasOfficers(ias);
        setIpsOfficers(ips);
        setLoadingOfficers(false);
      });

      if (meeting) {
        reset({
          officer_id: meeting.officer_id,
          officer_name: meeting.officer_name,
          officer_type: meeting.officer_type,
          designation: meeting.designation,
          department: meeting.department,
          meeting_date: meeting.meeting_date,
          meeting_time: meeting.meeting_time,
          duration: meeting.duration,
          location: meeting.location,
          agenda: meeting.agenda,
          status: meeting.status,
          attendees: meeting.attendees.join(", "),
          notes: meeting.notes,
          documents: meeting.documents.join(", "),
          created_by: meeting.created_by,
          follow_up_date: meeting.follow_up_date,
        });
      } else {
        reset({
          officer_id: "",
          officer_name: "",
          officer_type: "IAS",
          designation: "",
          department: "",
          meeting_date: "",
          meeting_time: "",
          duration: 60,
          location: "",
          agenda: "",
          status: "Scheduled",
          attendees: "",
          notes: "",
          documents: "",
          created_by: "Admin",
          follow_up_date: "",
        });
      }
    }
  }, [open, meeting, reset]);

  const activeOfficers = selectedOfficerType === "IAS" ? iasOfficers : ipsOfficers;

  const handleOfficerChange = (value: string | null) => {
    if (value) {
      setValue("officer_id", value);
      const officer = activeOfficers.find((o) => o.id === value);
      if (officer) {
        const officerName = ((officer as any).name || "") as string;
        setValue("officer_name", officerName as any);
      }
    }
  };

  const handleOfficerTypeChange = (value: "IAS" | "IPS" | null) => {
    if (value) {
      setValue("officer_type", value);
      setValue("officer_id", "");
      setValue("officer_name", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full sm:max-w-xl md:max-w-2xl rounded-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-screen overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <DialogTitle>{meeting ? "Edit Meeting" : "Add New Meeting"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => {
          onSubmit({
            ...data,
            officer_id: data.officer_id || "",
            created_by: data.created_by || "Admin",
          });
        })} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Officer Type *</label>
                <Select value={watch("officer_type") || ""} onValueChange={handleOfficerTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IAS">IAS</SelectItem>
                    <SelectItem value="IPS">IPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Officer Name *</label>
                <SearchableSelect
                  options={activeOfficers.map((o) => ({ label: o.name, value: o.id }))}
                  value={watch("officer_id") || undefined}
                  onValueChange={handleOfficerChange}
                  placeholder={loadingOfficers ? "Loading officers..." : "Choose officer"}
                  triggerClassName="w-full"
                />
                {formState.errors.officer_name && <p className="text-xs text-red-500">{formState.errors.officer_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Designation *</label>
                <Input {...register("designation")} placeholder="Designation" />
                {formState.errors.designation && <p className="text-xs text-red-500">{formState.errors.designation.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Department *</label>
                <Input {...register("department")} placeholder="Department" />
                {formState.errors.department && <p className="text-xs text-red-500">{formState.errors.department.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Meeting Date *</label>
                <Input type="date" {...register("meeting_date")} />
                {formState.errors.meeting_date && <p className="text-xs text-red-500">{formState.errors.meeting_date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Meeting Time *</label>
                <Input type="time" {...register("meeting_time")} />
                {formState.errors.meeting_time && <p className="text-xs text-red-500">{formState.errors.meeting_time.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Duration (minutes) *</label>
                <Input type="number" {...register("duration", { valueAsNumber: true })} />
                {formState.errors.duration && <p className="text-xs text-red-500">{formState.errors.duration.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Location *</label>
                <Input {...register("location")} placeholder="Location" />
                {formState.errors.location && <p className="text-xs text-red-500">{formState.errors.location.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Agenda *</label>
                <Textarea {...register("agenda")} placeholder="Meeting agenda" rows={3} />
                {formState.errors.agenda && <p className="text-xs text-red-500">{formState.errors.agenda.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status *</label>
                <Select value={watch("status") || ""} onValueChange={(value) => setValue("status", value as Meeting["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Attendees (comma-separated)</label>
                <Input {...register("attendees")} placeholder="Name 1, Name 2, ..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes/Minutes</label>
                <Textarea {...register("notes")} placeholder="Meeting notes" rows={3} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Documents (URLs, comma-separated)</label>
                <Input {...register("documents")} placeholder="https://..." />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : meeting ? "Update Meeting" : "Add Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
