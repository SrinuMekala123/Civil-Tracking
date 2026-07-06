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
import pb from "@/lib/pocketbase";
import type { CalendarEvent } from "@/types";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  event_type: z.enum(["meeting", "appointment", "follow_up", "training", "inspection"]),
  start_date: z.string().min(1, "Start date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_date: z.string().optional(),
  end_time: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled", "postponed"]),
  location: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  officer_type: z.enum(["None", "IAS", "IPS"]),
  officer_id: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  onSubmit: (values: any) => void;
  isSubmitting?: boolean;
}

export function EventFormModal({ open, onOpenChange, event, onSubmit, isSubmitting = false }: EventFormModalProps) {
  const [iasOfficers, setIasOfficers] = useState<any[]>([]);
  const [ipsOfficers, setIpsOfficers] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officerSearch, setOfficerSearch] = useState("");

  const { register, handleSubmit, reset, formState, setValue, watch } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      event_type: "meeting",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
      status: "scheduled",
      location: "",
      description: "",
      color: "blue",
      officer_type: "None",
      officer_id: "",
    },
  });

  const selectedOfficerType = watch("officer_type");

  useEffect(() => {
    if (open) {
      setLoadingOfficers(true);
      setOfficerSearch("");
      Promise.all([
        pb.collection("ias_officers").getFullList({ sort: "name" }).catch(() => []),
        pb.collection("ips_officers").getFullList({ sort: "name" }).catch(() => []),
      ]).then(([ias, ips]) => {
        setIasOfficers(ias);
        setIpsOfficers(ips);
        setLoadingOfficers(false);
      });

      if (event) {
        let type: "None" | "IAS" | "IPS" = "None";
        let offId = "";
        if (event.ias_officer_id) {
          type = "IAS";
          offId = event.ias_officer_id;
        } else if (event.ips_officer_id) {
          type = "IPS";
          offId = event.ips_officer_id;
        }

        reset({
          title: event.title,
          event_type: event.event_type as any,
          start_date: event.start_date,
          start_time: event.start_time,
          end_date: event.end_date,
          end_time: event.end_time,
          status: event.status as any,
          location: event.location,
          description: event.description,
          color: event.color || "blue",
          officer_type: type,
          officer_id: offId,
        });
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const localDateStr = `${yyyy}-${mm}-${dd}`;

        reset({
          title: "",
          event_type: "meeting",
          start_date: localDateStr,
          start_time: "10:00",
          end_date: localDateStr,
          end_time: "11:00",
          status: "scheduled",
          location: "",
          description: "",
          color: "blue",
          officer_type: "None",
          officer_id: "",
        });
      }
    }
  }, [open, event, reset]);

  const handleFormSubmit = (data: EventFormValues) => {
    const payload: any = {
      title: data.title,
      event_type: data.event_type,
      start_date: data.start_date,
      start_time: data.start_time,
      end_date: data.end_date || data.start_date,
      end_time: data.end_time || "",
      status: data.status,
      location: data.location || "",
      description: data.description || "",
      color: data.color || "blue",
    };

    if (data.officer_type === "IAS" && data.officer_id) {
      payload.ias_officer_id = data.officer_id;
      payload.ips_officer_id = null;
    } else if (data.officer_type === "IPS" && data.officer_id) {
      payload.ips_officer_id = data.officer_id;
      payload.ias_officer_id = null;
    } else {
      payload.ias_officer_id = null;
      payload.ips_officer_id = null;
    }

    onSubmit(payload);
  };

  const activeOfficers = selectedOfficerType === "IAS" ? iasOfficers : ipsOfficers;

  const filteredOfficers = activeOfficers.filter((o) =>
    o.name?.toLowerCase().includes(officerSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full sm:max-w-xl md:max-w-2xl rounded-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-screen overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title *</label>
              <Input {...register("title")} placeholder="Meeting, Inspection, etc." />
              {formState.errors.title && <p className="text-xs text-red-500">{formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select value={watch("event_type") || ""} onValueChange={(v) => setValue("event_type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <Select value={watch("status") || ""} onValueChange={(v) => setValue("status", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <Input type="date" {...register("start_date")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input type="time" {...register("start_time")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" {...register("end_date")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input type="time" {...register("end_time")} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input {...register("location")} placeholder="Office, Room, Virtual, etc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Officer Cadre Type</label>
                  <Select value={watch("officer_type") || ""} onValueChange={(v) => { setValue("officer_type", v as any); setValue("officer_id", ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="IAS">IAS</SelectItem>
                    <SelectItem value="IPS">IPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedOfficerType !== "None" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Officer</label>
                  <SearchableSelect
                    options={activeOfficers.map((o) => ({ label: o.name, value: o.id }))}
                    value={watch("officer_id") || undefined}
                    onValueChange={(value) => setValue("officer_id", value)}
                    placeholder={loadingOfficers ? "Loading officers..." : "Choose officer"}
                    triggerClassName="w-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...register("description")} placeholder="Details of the event..." rows={3} />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : event ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
