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
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/types";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["Super Admin", "Admin", "Officer", "Viewer"]),
  permissions: z.string().min(1, "Permissions are required"),
  department: z.string().min(1, "Department is required"),
  phone: z.string().min(10, "Valid phone is required"),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (values: UserFormValues) => void;
  isSubmitting?: boolean;
}

export function UserFormModal({ open, onOpenChange, user, onSubmit, isSubmitting = false }: UserFormModalProps) {
  const schema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    role: z.enum(["Super Admin", "Admin", "Officer", "Viewer"]),
    permissions: z.string().min(1, "Permissions are required"),
    department: z.string().min(1, "Department is required"),
    phone: z.string().min(10, "Valid phone is required"),
    status: z.enum(["Active", "Inactive", "Suspended"]),
    password: user 
      ? z.string().optional() 
      : z.string().min(8, "Password must be at least 8 characters"),
  });

  const { register, handleSubmit, reset, watch, formState, setValue } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "Viewer",
      permissions: "",
      department: "",
      phone: "",
      status: "Active",
      password: "",
    },
  });

  const roleValue = watch("role");
  const statusValue = watch("status");

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions.join(", "),
          department: user.department,
          phone: user.phone,
          status: user.status,
          password: "",
        });
      } else {
        reset({
          name: "",
          email: "",
          role: "Viewer",
          permissions: "",
          department: "",
          phone: "",
          status: "Active",
          password: "",
        });
      }
    }
  }, [open, user, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 left-auto bottom-0 translate-x-0 translate-y-0 h-full w-full sm:max-w-xl md:max-w-2xl rounded-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-screen overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name *</label>
                <Input {...register("name")} placeholder="Full name" />
                {formState.errors.name && <p className="text-xs text-red-500">{formState.errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email *</label>
                <Input type="email" {...register("email")} placeholder="user@gov.in" />
                {formState.errors.email && <p className="text-xs text-red-500">{formState.errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Role *</label>
                <Select value={roleValue || "Viewer"} onValueChange={(value) => setValue("role", value as User["role"])}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Officer">Officer</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Department *</label>
                <Input {...register("department")} placeholder="Department" />
                {formState.errors.department && <p className="text-xs text-red-500">{formState.errors.department.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone *</label>
                <Input {...register("phone")} placeholder="+91-xxxxxxxxxx" />
                {formState.errors.phone && <p className="text-xs text-red-500">{formState.errors.phone.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status *</label>
                <Select value={statusValue || "Active"} onValueChange={(value) => setValue("status", value as User["status"])}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!user && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password *</label>
                  <Input type="password" {...register("password")} placeholder="Password (min 8 chars)" />
                  {formState.errors.password && <p className="text-xs text-red-500">{formState.errors.password.message as string}</p>}
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Permissions (comma-separated)</label>
                <Textarea {...register("permissions")} placeholder="read, write, delete, manage_users" rows={3} />
                {formState.errors.permissions && <p className="text-xs text-red-500">{formState.errors.permissions.message as string}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : user ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
