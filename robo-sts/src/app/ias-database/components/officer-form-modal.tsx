"use client";

import { useEffect } from "react";
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
import type { IASOfficer, IASOfficerFormValues } from "@/types";

const ALL_CADRES = [
  "AGMUT", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Assam-Meghalaya",
  "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const ALL_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

const officerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  batch_year: z.number().min(1990, "Invalid year"),
  cadre: z.string().min(1, "Cadre is required"),
  current_position: z.string().optional(),
  department: z.string().optional(),
  state: z.string().optional(),
  date_of_birth: z.string().optional(),
  appointment_date: z.string().optional(),
  contact_number: z.string().optional(),
  email: z.string().email("Valid email is required"),
  status: z.enum(["Active", "Inactive", "Suspended"]),
  photo_url: z.string().optional(),
  qualification: z.string().optional(),
  address: z.string().optional(),
  previous_postings: z.string().optional(),
  officer_id: z.string().optional(),
  source: z.string().optional(),
  domicile: z.string().optional(),
  pay_level: z.string().optional(),
  central_deputation: z.string().optional(),
  twitter_x: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  mobile_no: z.string().optional(),
  remarks: z.string().optional(),
});

type OfficerFormValues = z.infer<typeof officerSchema>;

interface OfficerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officer?: IASOfficer | null;
  onSubmit: (values: IASOfficerFormValues) => void;
  isSubmitting?: boolean;
}

export function OfficerFormModal({
  open,
  onOpenChange,
  officer,
  onSubmit,
  isSubmitting = false,
}: OfficerFormModalProps) {
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<IASOfficerFormValues>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      name: "",
      batch_year: 2015,
      cadre: "",
      current_position: "",
      department: "",
      state: "",
      date_of_birth: "",
      appointment_date: "",
      contact_number: "",
      email: "",
      status: "Active",
      photo_url: "",
      qualification: "",
      address: "",
      previous_postings: "",
      officer_id: "",
      source: "",
      domicile: "",
      pay_level: "",
      central_deputation: "",
      twitter_x: "",
      linkedin: "",
      instagram: "",
      mobile_no: "",
      remarks: "",
    },
  });
  const statusValue = watch("status");

  useEffect(() => {
    if (open) {
      if (officer) {
        reset({
          name: officer.name,
          batch_year: Number(officer.batch_year),
          cadre: officer.cadre,
          current_position: officer.current_position,
          department: officer.department,
          state: officer.state,
          date_of_birth: officer.date_of_birth,
          appointment_date: officer.appointment_date,
          contact_number: officer.contact_number,
          email: officer.email,
          status: officer.status,
          photo_url: officer.photo_url,
          qualification: officer.qualification,
          address: officer.address,
          previous_postings: officer.previous_postings.join(", "),
          officer_id: officer.officer_id,
          source: officer.source,
          domicile: officer.domicile,
          pay_level: officer.pay_level,
          central_deputation: officer.central_deputation,
          twitter_x: officer.twitter_x,
          linkedin: officer.linkedin,
          instagram: officer.instagram,
          mobile_no: officer.mobile_no,
          remarks: officer.remarks,
        });
      } else {
        reset({
          name: "",
          batch_year: 2015,
          cadre: "",
          current_position: "",
          department: "",
          state: "",
          date_of_birth: "",
          appointment_date: "",
          contact_number: "",
          email: "",
          status: "Active",
          photo_url: "",
          qualification: "",
          address: "",
          previous_postings: "",
          officer_id: "",
          source: "",
          domicile: "",
          pay_level: "",
          central_deputation: "",
          twitter_x: "",
          linkedin: "",
          instagram: "",
          mobile_no: "",
          remarks: "",
        });
      }
    }
  }, [open, officer, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full sm:max-w-xl md:max-w-2xl rounded-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-screen overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <DialogTitle>{officer ? "Edit IAS Officer" : "Add New IAS Officer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Officer Name *</label>
                <Input {...register("name")} placeholder="Full name" />
                {formState.errors.name && <p className="text-xs text-red-500">{formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Batch Year *</label>
                <Input type="number" {...register("batch_year", { valueAsNumber: true })} />
                {formState.errors.batch_year && <p className="text-xs text-red-500">{formState.errors.batch_year.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Cadre *</label>
                <SearchableSelect
                  options={ALL_CADRES.map((c) => ({ label: c, value: c }))}
                  value={watch("cadre") || undefined}
                  onValueChange={(value) => setValue("cadre", value)}
                  placeholder="Select cadre"
                  triggerClassName="w-full"
                />
                {formState.errors.cadre && <p className="text-xs text-red-500">{formState.errors.cadre.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">State *</label>
                <SearchableSelect
                  options={ALL_STATES.map((s) => ({ label: s, value: s }))}
                  value={watch("state") || undefined}
                  onValueChange={(value) => setValue("state", value)}
                  placeholder="Select state"
                  triggerClassName="w-full"
                />
                {formState.errors.state && <p className="text-xs text-red-500">{formState.errors.state.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Current Position *</label>
                <Input {...register("current_position")} placeholder="Current position" />
                {formState.errors.current_position && <p className="text-xs text-red-500">{formState.errors.current_position.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Department/Ministry *</label>
                <Input {...register("department")} placeholder="Department" />
                {formState.errors.department && <p className="text-xs text-red-500">{formState.errors.department.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date of Birth *</label>
                <Input type="date" {...register("date_of_birth")} />
                {formState.errors.date_of_birth && <p className="text-xs text-red-500">{formState.errors.date_of_birth.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Appointment Date *</label>
                <Input type="date" {...register("appointment_date")} />
                {formState.errors.appointment_date && <p className="text-xs text-red-500">{formState.errors.appointment_date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contact Number *</label>
                <Input {...register("contact_number")} placeholder="+91-xxxxxxxxxx" />
                {formState.errors.contact_number && <p className="text-xs text-red-500">{formState.errors.contact_number.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email *</label>
                <Input type="email" {...register("email")} placeholder="officer@gov.in" />
                {formState.errors.email && <p className="text-xs text-red-500">{formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status *</label>
                <Select value={statusValue || "Active"} onValueChange={(value) => setValue("status", value as IASOfficer["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Photo URL *</label>
                <Input {...register("photo_url")} placeholder="https://..." />
                {formState.errors.photo_url && <p className="text-xs text-red-500">{formState.errors.photo_url.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Qualification *</label>
                <Input {...register("qualification")} placeholder="Qualification" />
                {formState.errors.qualification && <p className="text-xs text-red-500">{formState.errors.qualification.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Address *</label>
                <Textarea {...register("address")} placeholder="Full address" rows={3} />
                {formState.errors.address && <p className="text-xs text-red-500">{formState.errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Officer ID</label>
                <Input {...register("officer_id")} placeholder="e.g. IAS0042" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Source</label>
                <Input {...register("source")} placeholder="e.g. Direct Recruitment, Promotion, Deputation" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Domicile</label>
                <Input {...register("domicile")} placeholder="Home state/district" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Pay Level</label>
                <Input {...register("pay_level")} placeholder="e.g. Level 14" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Central Deputation</label>
                <Select value={watch("central_deputation") || ""} onValueChange={(value) => setValue("central_deputation", value ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mobile No</label>
                <Input {...register("mobile_no")} placeholder="+91-xxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Twitter/X</label>
                <Input {...register("twitter_x")} placeholder="https://twitter.com/... or @handle" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">LinkedIn</label>
                <Input {...register("linkedin")} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Instagram</label>
                <Input {...register("instagram")} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Remarks</label>
                <Textarea {...register("remarks")} placeholder="Optional notes or remarks" rows={2} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Previous Postings</label>
                <Textarea {...register("previous_postings")} placeholder="Sub-Collector, Pune; SDM, Bangalore; etc." rows={3} />
                <p className="text-xs text-slate-400">Separate multiple postings with a semicolon or comma</p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : officer ? "Update Officer" : "Add Officer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
