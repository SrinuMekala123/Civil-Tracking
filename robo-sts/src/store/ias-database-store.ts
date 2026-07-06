"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { IASOfficer } from "@/types";
import { createUpdateLog } from "@/lib/logging-utils";

interface IASDatabaseState {
  officers: IASOfficer[];
  isLoading: boolean;
  error: string | null;
  selectedIds: string[];
  totalCount: number;
  currentPage: number;
  pageSize: number;

  fetchOfficers: (page?: number, pageSize?: number, filters?: { cadre?: string; state?: string; status?: string; search?: string }) => Promise<void>;
  addOfficer: (officer: Partial<IASOfficer>) => Promise<void>;
  updateOfficer: (id: string, data: Partial<IASOfficer>) => Promise<void>;
  deleteOfficer: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;

  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useIASDatabaseStore = create<IASDatabaseState>((set, get) => ({
  officers: [],
  isLoading: false,
  error: null,
  selectedIds: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,

  fetchOfficers: async (page = 1, pageSize = 20, filters) => {
    set({ isLoading: true, error: null, currentPage: page, pageSize });
    try {
      const parts: string[] = [];
      if (filters?.cadre && filters.cadre !== "all") parts.push(`cadre~"${filters.cadre}"`);
      if (filters?.state && filters.state !== "all") parts.push(`state~"${filters.state}"`);
      if (filters?.status && filters.status !== "all") parts.push(`status~"${filters.status}"`);
      if (filters?.search) {
        const q = filters.search;
        const num = Number(q);
        const isNum = !isNaN(num) && num > 0;
        const searchParts = [
          `officer_id~"${q}"`,
          `name~"${q}"`,
          `cadre~"${q}"`,
          `current_position~"${q}"`,
          `department~"${q}"`,
          `state~"${q}"`,
          `contact_number~"${q}"`,
          `email~"${q}"`,
          `qualification~"${q}"`,
          `address~"${q}"`,
          `domicile~"${q}"`,
          `pay_level~"${q}"`,
          `central_deputation~"${q}"`,
          `twitter_x~"${q}"`,
          `linkedin~"${q}"`,
          `instagram~"${q}"`,
          `mobile_no~"${q}"`,
          `remarks~"${q}"`,
          `status~"${q}"`
        ];
        if (isNum) {
          searchParts.push(`batch_year = ${num}`);
        }
        parts.push(`(${searchParts.join(" || ")})`);
      }
      const filter = parts.length ? parts.join(" && ") : undefined;

      const result = await pb.collection("ias_officers").getList(page, pageSize, {
        sort: "-created",
        filter,
      });

      const mappedOfficers: IASOfficer[] = result.items.map((record) => ({
        id: record.id,
        officer_id: record.officer_id || "",
        name: record.name,
        batch_year: record.batch_year,
        cadre: record.cadre,
        current_position: record.current_position,
        department: record.department,
        state: record.state,
        date_of_birth: record.date_of_birth ? record.date_of_birth.split(" ")[0] : "",
        appointment_date: record.appointment_date ? record.appointment_date.split(" ")[0] : "",
        contact_number: record.contact_number,
        email: record.email,
        status: record.status as "Active" | "Inactive" | "Suspended",
        photo_url: record.photo_url
          ? pb.files.getUrl(record, record.photo_url)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=6366f1&color=fff`,
        qualification: record.qualification,
        address: record.address,
        previous_postings: Array.isArray(record.previous_postings) ? record.previous_postings : [],
        created: record.created,
        updated: record.updated,
        source: record.source || "",
        domicile: record.domicile || "",
        pay_level: record.pay_level || "",
        central_deputation: record.central_deputation || "",
        twitter_x: record.twitter_x || "",
        linkedin: record.linkedin || "",
        instagram: record.instagram || "",
        mobile_no: record.mobile_no || "",
        remarks: record.remarks || "",
      }));

      set({
        officers: mappedOfficers,
        totalCount: result.totalItems,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load data";
      console.error("Failed to fetch IAS officers:", error);
      set({ error: message, isLoading: false });
    }
  },

  addOfficer: async (officerData) => {
    try {
      await pb.collection("ias_officers").create(officerData);
      try {
        await pb.collection("notifications").create({
          title: "New IAS Officer Added",
          message: `Added IAS Officer: ${officerData.name} (Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'})`,
          time: new Date().toISOString(),
          read: false,
          type: "success"
        });
      } catch (e) {
        console.error("Failed to add notification for new IAS officer:", e);
      }
      try {
        await createUpdateLog({
          officer_name: officerData.name,
          update_type: "New Appointment",
          description: `Added IAS Officer: ${officerData.name} (Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'})`,
          new_value: `Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'}`,
          priority: "Low"
        });
      } catch (e) {
        console.error("Failed to log addOfficer to update_logs:", e);
      }
      await get().fetchOfficers(get().currentPage, get().pageSize);
    } catch (error) {
      console.error("Failed to add officer:", error);
    }
  },

  updateOfficer: async (id, data) => {
    try {
      const oldOfficer = get().officers.find((o) => o.id === id);
      await pb.collection("ias_officers").update(id, data);
      if (oldOfficer) {
        const changes: string[] = [];
        for (const [key, value] of Object.entries(data)) {
          if (key === "updated" || key === "id" || key === "created" || key === "photo_url") continue;
          const oldVal = (oldOfficer as any)[key];
          const oldStr = Array.isArray(oldVal) ? oldVal.join(", ") : String(oldVal !== undefined && oldVal !== null ? oldVal : "");
          const newStr = Array.isArray(value) ? value.join(", ") : String(value !== undefined && value !== null ? value : "");
          if (oldStr !== newStr) {
            const niceKey = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            changes.push(`"${niceKey}" from "${oldStr || 'N/A'}" to "${newStr || 'N/A'}"`);
          }
        }
        if (changes.length > 0) {
          try {
            await pb.collection("notifications").create({
              title: "IAS Officer Updated",
              message: `Updated IAS Officer ${oldOfficer.name}: changed ${changes.join(", ")}`,
              time: new Date().toISOString(),
              read: false,
              type: "info"
            });
          } catch (e) {
            console.error("Failed to add notification for update IAS officer:", e);
          }
          try {
            await createUpdateLog({
              officer_name: oldOfficer.name,
              update_type: data.current_position !== undefined && data.current_position !== oldOfficer.current_position ? "Officer Transferred" : "Department Change",
              description: `Updated IAS Officer ${oldOfficer.name}: changed ${changes.join(", ")}`,
              previous_value: `Original Profile`,
              new_value: changes.join(", "),
              priority: "Medium"
            });
          } catch (e) {
            console.error("Failed to log updateOfficer to update_logs:", e);
          }
        }
      }
      await get().fetchOfficers(get().currentPage, get().pageSize);
    } catch (error) {
      console.error("Failed to update officer:", error);
    }
  },

  deleteOfficer: async (id) => {
    try {
      const oldOfficer = get().officers.find((o) => o.id === id);
      await pb.collection("ias_officers").delete(id);
      if (oldOfficer) {
        try {
          await pb.collection("notifications").create({
            title: "IAS Officer Deleted",
            message: `Deleted IAS Officer: ${oldOfficer.name} (ID: ${oldOfficer.officer_id || 'N/A'})`,
            time: new Date().toISOString(),
            read: false,
            type: "warning"
          });
        } catch (e) {
          console.error("Failed to add notification for deleted IAS officer:", e);
        }
        try {
          await createUpdateLog({
            officer_name: oldOfficer.name,
            update_type: "Officer Removed",
            description: `Deleted IAS Officer: ${oldOfficer.name} (ID: ${oldOfficer.officer_id || 'N/A'})`,
            previous_value: `ID: ${oldOfficer.officer_id || 'N/A'}`,
            priority: "High"
          });
        } catch (e) {
          console.error("Failed to log deleteOfficer to update_logs:", e);
        }
      }
      set((state) => ({
        officers: state.officers.filter((o) => o.id !== id),
        selectedIds: state.selectedIds.filter((i) => i !== id),
      }));
      await get().fetchOfficers(get().currentPage, get().pageSize);
    } catch (error) {
      console.error("Failed to delete officer:", error);
    }
  },

  bulkDelete: async (ids) => {
    try {
      const deletedNames = get().officers.filter((o) => ids.includes(o.id)).map((o) => o.name);
      for (const id of ids) {
        await pb.collection("ias_officers").delete(id);
      }
      if (deletedNames.length > 0) {
        try {
          await pb.collection("notifications").create({
            title: "Multiple IAS Officers Deleted",
            message: `Deleted IAS Officers: ${deletedNames.join(", ")}`,
            time: new Date().toISOString(),
            read: false,
            type: "warning"
          });
        } catch (e) {
          console.error("Failed to add notification for bulk delete IAS officers:", e);
        }
        try {
          await createUpdateLog({
            update_type: "Officers Bulk Delete",
            description: `Bulk deleted ${deletedNames.length} IAS Officers: ${deletedNames.join(", ")}`,
            previous_value: deletedNames.join(", "),
            priority: "High"
          });
        } catch (e) {
          console.error("Failed to log bulkDelete to update_logs:", e);
        }
      }
      set((state) => ({
        officers: state.officers.filter((o) => !ids.includes(o.id)),
        selectedIds: [],
      }));
      await get().fetchOfficers(get().currentPage, get().pageSize);
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),

  toggleSelected: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((item) => item !== id)
      : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
