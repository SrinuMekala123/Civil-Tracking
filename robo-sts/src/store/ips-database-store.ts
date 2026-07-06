"use client";
import { create } from "zustand";
import pb from "@/lib/pocketbase";
import type { IPSOfficer } from "@/types";
import { createUpdateLog } from "@/lib/logging-utils";

interface IPSDatabaseState {
  officers: IPSOfficer[];
  isLoading: boolean;
  error: string | null;
  selectedIds: string[];
  totalCount: number;
  currentPage: number;
  pageSize: number;

  fetchOfficers: (page?: number, pageSize?: number, filters?: { cadre?: string; state?: string; rank?: string; search?: string; status?: string }) => Promise<void>;
  addOfficer: (officer: Partial<IPSOfficer>) => Promise<void>;
  updateOfficer: (id: string, data: Partial<IPSOfficer>) => Promise<void>;
  deleteOfficer: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;

  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useIPSDatabaseStore = create<IPSDatabaseState>((set, get) => ({
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
          `name~"${q}"`,
          `cadre~"${q}"`,
          `current_position~"${q}"`,
          `rank~"${q}"`,
          `police_station~"${q}"`,
          `range~"${q}"`,
          `state~"${q}"`,
          `contact_number~"${q}"`,
          `email~"${q}"`,
          `status~"${q}"`
        ];
        if (isNum) {
          searchParts.push(`batch_year = ${num}`);
        }
        parts.push(`(${searchParts.join(" || ")})`);
      }
      const filter = parts.length ? parts.join(" && ") : undefined;

      const result = await pb.collection("ips_officers").getList(page, pageSize, {
        sort: "-created",
        filter,
      });

      const mappedOfficers: IPSOfficer[] = result.items.map((record) => ({
        id: record.id,
        name: record.name,
        batch_year: record.batch_year,
        cadre: record.cadre,
        current_position: record.current_position,
        rank: record.rank || "SP",
        police_station: record.police_station || "N/A",
        range: record.range || "",
        state: record.state,
        date_of_birth: record.date_of_birth ? record.date_of_birth.split(" ")[0] : "",
        appointment_date: record.appointment_date ? record.appointment_date.split(" ")[0] : "",
        contact_number: record.contact_number,
        email: record.email,
        status: record.status as "Active" | "Inactive" | "Suspended",
        photo_url: record.photo_url
          ? pb.files.getUrl(record, record.photo_url)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=dc2626&color=fff`,
        specialization: Array.isArray(record.specialization) ? record.specialization : [],
        awards: Array.isArray(record.awards) ? record.awards : [],
        created: record.created,
        updated: record.updated,
      }));

      set({
        officers: mappedOfficers,
        totalCount: result.totalItems,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load data";
      console.error("Failed to fetch IPS officers:", error);
      set({ error: message, isLoading: false });
    }
  },

  addOfficer: async (officerData) => {
    try {
      await pb.collection("ips_officers").create(officerData);
      try {
        await pb.collection("notifications").create({
          title: "New IPS Officer Added",
          message: `Added IPS Officer: ${officerData.name} (Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'})`,
          time: new Date().toISOString(),
          read: false,
          type: "success"
        });
      } catch (e) {
        console.error("Failed to add notification for new IPS officer:", e);
      }
      try {
        await createUpdateLog({
          officer_name: officerData.name,
          update_type: "New Appointment",
          description: `Added IPS Officer: ${officerData.name} (Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'})`,
          new_value: `Batch: ${officerData.batch_year || 'N/A'}, Cadre: ${officerData.cadre || 'N/A'}`,
          priority: "Low"
        });
      } catch (e) {
        console.error("Failed to log addOfficer to update_logs:", e);
      }
      await get().fetchOfficers(get().currentPage, get().pageSize);
    } catch (error) {
      console.error("Failed to add IPS officer:", error);
    }
  },

  updateOfficer: async (id, data) => {
    try {
      const oldOfficer = get().officers.find((o) => o.id === id);
      await pb.collection("ips_officers").update(id, data);
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
              title: "IPS Officer Updated",
              message: `Updated IPS Officer ${oldOfficer.name}: changed ${changes.join(", ")}`,
              time: new Date().toISOString(),
              read: false,
              type: "info"
            });
          } catch (e) {
            console.error("Failed to add notification for update IPS officer:", e);
          }
          try {
            await createUpdateLog({
              officer_name: oldOfficer.name,
              update_type: data.current_position !== undefined && data.current_position !== oldOfficer.current_position ? "Officer Transferred" : "Department Change",
              description: `Updated IPS Officer ${oldOfficer.name}: changed ${changes.join(", ")}`,
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
      console.error("Failed to update IPS officer:", error);
    }
  },

  deleteOfficer: async (id) => {
    try {
      const oldOfficer = get().officers.find((o) => o.id === id);
      await pb.collection("ips_officers").delete(id);
      if (oldOfficer) {
        try {
          await pb.collection("notifications").create({
            title: "IPS Officer Deleted",
            message: `Deleted IPS Officer: ${oldOfficer.name} (Rank: ${oldOfficer.rank || 'N/A'})`,
            time: new Date().toISOString(),
            read: false,
            type: "warning"
          });
        } catch (e) {
          console.error("Failed to add notification for deleted IPS officer:", e);
        }
        try {
          await createUpdateLog({
            officer_name: oldOfficer.name,
            update_type: "Officer Removed",
            description: `Deleted IPS Officer: ${oldOfficer.name} (Rank: ${oldOfficer.rank || 'N/A'})`,
            previous_value: `Rank: ${oldOfficer.rank || 'N/A'}`,
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
      console.error("Failed to delete IPS officer:", error);
    }
  },

  bulkDelete: async (ids) => {
    try {
      const deletedNames = get().officers.filter((o) => ids.includes(o.id)).map((o) => o.name);
      for (const id of ids) {
        await pb.collection("ips_officers").delete(id);
      }
      if (deletedNames.length > 0) {
        try {
          await pb.collection("notifications").create({
            title: "Multiple IPS Officers Deleted",
            message: `Deleted IPS Officers: ${deletedNames.join(", ")}`,
            time: new Date().toISOString(),
            read: false,
            type: "warning"
          });
        } catch (e) {
          console.error("Failed to add notification for bulk delete IPS officers:", e);
        }
        try {
          await createUpdateLog({
            update_type: "Officers Bulk Delete",
            description: `Bulk deleted ${deletedNames.length} IPS Officers: ${deletedNames.join(", ")}`,
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
      console.error("Failed to bulk delete IPS officers:", error);
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
