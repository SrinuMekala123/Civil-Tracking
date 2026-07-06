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
import { Pencil, Mail, Phone, MapPin, Calendar, Award, ExternalLink } from "lucide-react";
import type { IASOfficer } from "@/types";

interface OfficerViewModalProps {
  open: boolean;
  officer: IASOfficer | null;
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
          <div className="flex items-center gap-4">
            <img
              src={officer.photo_url}
              alt={officer.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(officer.name)}&background=6366f1&color=fff&size=64`;
              }}
            />
            <div className="flex-1">
              <SheetTitle className="text-xl">{officer.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusClasses}>{officer.status}</Badge>
                {officer.officer_id && (
                  <span className="text-xs text-slate-500 font-mono">ID: {officer.officer_id}</span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Batch Year:</span>
                <p className="font-medium">{officer.batch_year}</p>
              </div>
              <div>
                <span className="text-slate-500">Cadre:</span>
                <p className="font-medium">{officer.cadre}</p>
              </div>
              <div>
                <span className="text-slate-500">State:</span>
                <p className="font-medium">{officer.state}</p>
              </div>
              <div>
                <span className="text-slate-500">Source:</span>
                <p className="font-medium">{officer.source || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500">Domicile:</span>
                <p className="font-medium">{officer.domicile || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500">Pay Level:</span>
                <p className="font-medium">{officer.pay_level || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500">Central Deputation:</span>
                <p className="font-medium">{officer.central_deputation || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500">Qualification:</span>
                <p className="font-medium">{officer.qualification || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Current Position</h3>
            <div className="text-sm">
              <span className="text-slate-500">Present Post:</span>
              <p className="font-medium">{officer.current_position || "N/A"}</p>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Dates</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date of Birth:</span>
                <p className="font-medium">{officer.date_of_birth || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Appointment Date:</span>
                <p className="font-medium">{officer.appointment_date || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              {officer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${officer.email}`} className="text-blue-600 hover:underline">{officer.email}</a>
                </div>
              )}
              {officer.contact_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{officer.contact_number}</span>
                </div>
              )}
              {officer.mobile_no && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{officer.mobile_no} (Mobile)</span>
                </div>
              )}
              {officer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{officer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          {(officer.twitter_x || officer.linkedin || officer.instagram) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Social Media</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {officer.twitter_x && officer.twitter_x !== 'Not Publicly Active' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Twitter/X:</span>
                    <a href={officer.twitter_x.startsWith('http') ? officer.twitter_x : `https://twitter.com/${officer.twitter_x}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      {officer.twitter_x} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {officer.linkedin && officer.linkedin !== 'Not Publicly Active' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">LinkedIn:</span>
                    <a href={officer.linkedin.startsWith('http') ? officer.linkedin : `https://linkedin.com/in/${officer.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      {officer.linkedin} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {officer.instagram && officer.instagram !== 'Not Publicly Active' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Instagram:</span>
                    <a href={officer.instagram.startsWith('http') ? officer.instagram : `https://instagram.com/${officer.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      {officer.instagram} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Postings */}
          {officer.previous_postings && officer.previous_postings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Previous Postings</h3>
              <div className="flex flex-wrap gap-2">
                {officer.previous_postings.map((posting, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {posting}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          {officer.remarks && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 border-b pb-2">Remarks</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{officer.remarks}</p>
            </div>
          )}
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