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
import type { IPSOfficer } from "@/types";
import { Pencil, Phone, Mail } from "lucide-react";

interface OfficerViewModalProps {
  open: boolean;
  officer: IPSOfficer | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function OfficerViewModal({ open, officer, onOpenChange, onEdit }: OfficerViewModalProps) {
  if (!officer) return null;

  const statusClasses =
    officer.status === "Active"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : officer.status === "Inactive"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl p-0 gap-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={officer.photo_url}
                alt={officer.name}
                className="w-12 h-12 rounded-full object-cover border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(officer.name)}&background=dc2626&color=fff`;
                }}
              />
              <div>
                <SheetTitle>{officer.name}</SheetTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">{officer.current_position}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => alert(`Calling ${officer.contact_number}...`)}>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => alert(`Email: ${officer.email}`)}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={statusClasses}>{officer.status}</Badge>
            <span className="text-xs text-slate-500">Added on: {new Date(officer.created).toLocaleDateString()}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Batch Year</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.batch_year}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Cadre</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.cadre}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">State</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.state}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Rank</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.rank}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Police Station/Range</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.police_station} - {officer.range}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Date of Birth</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.date_of_birth}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Appointment Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.appointment_date}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Contact</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.contact_number}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{officer.email}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Last Updated</p>
              <p className="font-medium text-slate-900 dark:text-white">{new Date(officer.updated).toLocaleString()}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-slate-500 text-xs mb-1">Specialization</p>
            <div className="flex flex-wrap gap-2">
              {officer.specialization.map((spec) => (
                <Badge key={spec} className="border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{spec}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Awards/Medals</p>
            <ul className="list-disc list-inside text-sm text-slate-800 dark:text-slate-200 space-y-1">
              {officer.awards.map((award) => (
                <li key={award}>{award}</li>
              ))}
            </ul>
          </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-2 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Officer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
